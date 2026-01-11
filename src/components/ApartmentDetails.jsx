import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp, runTransaction } from 'firebase/firestore'
import { db } from '/public/config/firebaseinit'
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from '/public/ctx/FirebaseAuth'
import { auth } from "/public/config/firebaseinit";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

export default function ApartmentDetails() {
  const { apartmentId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [totalImages, setTotalImages] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const imagesPerPage = 1;

  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [bookedRanges, setBookedRanges] = useState([]);

  const [adminReservations, setAdminReservations] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [confirmingId, setConfirmingId] = useState(null);

  // Fetch Apartment

  useEffect(() => {
    if (!apartmentId) return;

    const fetchApartment = async () => {
      try {
        const docRef = doc(db, "apartments", apartmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setApartment(data);
          setTotalImages(data.imgsUrl?.length || 0);
        } else {
          console.log("No such apartment!");
        }
      } catch (err) {
        console.error("Error fetching apartment:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [apartmentId]);

  // Fetch Reservations
  const normalizeDate = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  useEffect(() => {
    if (!apartmentId) return;

    const fetchReservations = async () => {
      try {
        const q = query(
          collection(db, "reservations"),
          where("apartmentId", "==", apartmentId)
        );
        const snapshot = await getDocs(q);

        const ranges = snapshot.docs
        .filter(doc => doc.data().status === "active")   // <-- filter active only
        .map((doc) => {
          const data = doc.data();
          return {
            from: normalizeDate(data.from.toDate()),
            to: normalizeDate(data.to.toDate()),
          };
        });

        setBookedRanges(ranges);
      } catch (err) {
        console.error("Error fetching reservations:", err);
      }
    };

    fetchReservations();
  }, [apartmentId]);

  // Image Slider
  const handlePrev = () => {
    if (!totalImages) return;
    setStartIndex((prev) =>
      prev - imagesPerPage < 0
        ? (totalImages - imagesPerPage + totalImages) % totalImages
        : prev - imagesPerPage
    );
  };

  const handleNext = () => {
    if (!totalImages) return;
    setStartIndex((prev) => (prev + imagesPerPage) % totalImages);
  };

  // Show Phone
  const handlePhoneBtn = () => {
    // if (isAuthenticated) {
      setShowPhone(!showPhone);
    // } else {
    //   navigate("/login");
    //   alert("You must be logged in to access the phone number.");
    }
  // };

  // Reservation
  const handleReservation = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!range?.from || !range?.to) {
      alert("Please select a date range.");
      return;
    }

    const newRange = {
      from: normalizeDate(range.from),
      to: normalizeDate(range.to),
    };

    // Check Overlap
    const isOverlapping = bookedRanges.some(
      (r) => newRange.from <= r.to && newRange.to >= r.from
    );

    if (isOverlapping) {
      alert("This date range is already booked!");
      return;
    }

    try {
    await runTransaction(db, async (tx) => {
      const reservationsRef = collection(db, "reservations");
      
      // Fetch user's active reservations this month
      const snapshot = await getDocs(
        query(
          reservationsRef,
          where("userId", "==", user.uid),
          where("status", "==", "active")
        )
      );

      const now = new Date();
      const userActiveReservationsThisMonth = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const resDate = data.from.toDate();
        return resDate.getMonth() === now.getMonth() &&
               resDate.getFullYear() === now.getFullYear();
      });

      if (userActiveReservationsThisMonth.length >= 2 && !isAdmin) {
        throw new Error("MONTHLY_LIMIT");
      }

      // Enforce max 7 days unless admin
      const MS_PER_DAY = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((newRange.to - newRange.from + 1) / MS_PER_DAY);

      if (diffDays > 7 && !isAdmin) {
        throw new Error("TOO_LONG");
      }

      // Create reservation doc
      const reservationId = `${apartmentId}_${user.uid}_${Date.now()}`;
      const reservationRef = doc(reservationsRef, reservationId);

      tx.set(reservationRef, {
        apartmentId,
        userId: user.uid,
        from: Timestamp.fromDate(newRange.from),
        to: Timestamp.fromDate(newRange.to),
        nights: diffDays,
        createdAt: Timestamp.now(),
        status: "active",
        admin: isAdmin
      });
    });
    
      // on success ui
      alert("Reservation successful!");
      setBookedRanges((prev) => [...prev, newRange]);
      setRange({ from: undefined, to: undefined });
    
    }catch (err) {
      console.error("Reservation failed:", err);

      // errors ui
      switch (err.message) {
        case "ALREADY_RESERVED":
          alert("You already have a reservation for this apartment.");
          break;
        case "TOO_LONG":
          alert("Reservations longer than 7 days require confirmation. Please give us a call.");
          break;
        default:
          alert("Failed to make reservation. Please give us a call.");
      }
    }
  };




  useEffect(() => {
  if (!isAdmin || !apartmentId) return;

  const fetchAdminReservations = async () => {
    const start = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1
    );

    const end = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    );

    const q = query(
      collection(db, "reservations"),
      where("apartmentId", "==", apartmentId),
      where("status", "==", "active"),
      where("to", ">=", Timestamp.fromDate(start)),
      where("from", "<=", Timestamp.fromDate(end))
    );

    const snap = await getDocs(q);

    setAdminReservations(
      snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  fetchAdminReservations();
}, [isAdmin, apartmentId, selectedMonth]);

  const cancelReservation = async (id) => {
  const ref = doc(db, "reservations", id);

  await runTransaction(db, async (tx) => {
    tx.update(ref, {
      status: "cancelled",
      cancelledAt: Timestamp.now(),
    });
  });

  setAdminReservations((prev) =>
    prev.filter((r) => r.id !== id)
  );
};




  // Visible Images
  const visibleImages =
    apartment?.imgsUrl?.length > 0
      ? Array.from({ length: Math.min(imagesPerPage, totalImages) }, (_, i) => {
          const index = (startIndex + i) % totalImages;
          return apartment.imgsUrl[index];
        })
      : [];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="flex justify-center mt-5">
          <svg className="spinner" />
        </span>
      </div>
    );

  return (
    <div className="bg-gray-200">
      <div className="pt-6">
        {/* Images */}
        <div className="relative mx-auto mt-20 max-w-4xl px-4 select-none">
          <div className="overflow-hidden rounded-lg">
            {visibleImages.length > 0 && (
              <img
                src={visibleImages[0]}
                alt={`${apartment.name} ${startIndex + 1}`}
                className="w-full rounded-lg object-cover aspect-video transition-transform duration-500 hover:scale-105"
              />
            )}
          </div>

          {/* Arrows */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-white"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>

          <button
            onClick={handleNext}
            className="absolute top-1/2 -right-6 -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-white"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <p className="text-center text-gray-600 mt-4">
          Image {totalImages > 0 ? (startIndex % totalImages) + 1 : 0} of {totalImages}
        </p>

        {/* Apartment info */}
        <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{apartment.name}</h1>
          </div>

          <div className="mt-4 lg:row-span-3 lg:mt-0">
            <div className="mt-10">
              <button
                type="button"
                className="mt-10 flex w-full items-center justify-center btn-orange"
                onClick={handlePhoneBtn}
              >
                {showPhone ? "Hide Phone Number" : "Give us a call"}
              </button>
                {/* {apartment.phone} */}
                {/* {isAuthenticated && showPhone && ( */}
              {showPhone && (
                <p className="mt-4 text-center text-lg font-medium text-gray-900">
                  📞 088 654 8334 
                </p>
              )}
            </div>

            {/* Reservation Calendar */}
            <div className="mt-8 rounded-lg bg-white p-4 shadow">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 text-center">
                Select dates
              </h3>

              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                 disabled={[
                    { before: new Date() },
                    ...bookedRanges.map((r) => ({ from: r.from, to: r.to })),
                  ]}
                modifiers={{
                  booked: bookedRanges.map((r) => ({ from: r.from, to: r.to })),
                  past: { before: new Date() },
                }}
                modifiersStyles={{
                  booked: { backgroundColor: "#FF9990", color: "white" },
                  past: { color: "#999", textDecoration: "line-through" },
                }}
                numberOfMonths={1}
                footer={
                  range?.from && range?.to
                    ? <h4 className='text-center'>Selected from {range.from.toLocaleDateString()} to {range.to.toLocaleDateString()}</h4>
                    : <h4 className='text-center'>Please select a date range</h4>
                }
              />

              {/* VERIFIED USER */}
                {isAuthenticated && user?.emailVerified && (
                  <button
                    disabled={!range?.from || !range?.to}
                    onClick={handleReservation}
                    className={`mt-4 w-full rounded-md px-4 py-2 font-semibold text-white transition
                      ${
                        range?.from && range?.to
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "cursor-not-allowed bg-gray-300"
                      }
                    `}
                  >
                    Make a reservation
                  </button>
                )}

                {/* LOGGED IN BUT NOT VERIFIED */}
                {isAuthenticated && user && !user.emailVerified && (
                  <button
                    onClick={async () => {
                      try {
                        await sendEmailVerification(auth.currentUser);
                        alert("Verification email sent. Please check your inbox and spam box in 10-15 minutes. ");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to send verification email.");
                      }
                    }}
                    className="mt-4 w-full text-sm text-orange-600 underline"
                  >
                    Verify your email to make a reservation
                  </button>
                )}

                {/* NOT LOGGED IN */}
                {!isAuthenticated && (
                  <p className="mt-4 text-center text-sm text-gray-500">
                    Please log in to make a reservation.
                  </p>
                )}
            </div>
          </div>
            
          <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
            {/* Details */}
            <div>
              <h3 className="sr-only">Details</h3>
              <div className="space-y-6">
                <p className="text-base text-gray-900">{apartment.details || 'No details available.'}</p>
              </div>
            </div>
          </div>

            {isAdmin && (
              <div className="mt-10 rounded-lg border bg-white p-4 shadow">
                <h2 className="mb-4 text-lg font-semibold">Admin table – Reservations</h2>
                      
                {/* Month selector */}
                <input
                  type="month"
                  value={`${selectedMonth.getFullYear()}-${String(
                    selectedMonth.getMonth() + 1
                  ).padStart(2, "0")}`}
                  onChange={(e) =>
                    setSelectedMonth(new Date(e.target.value + "-01"))
                  }
                  className="mb-4 rounded border px-3 py-1"
                />

                {adminReservations.length === 0 ? (
                  <p className="text-sm text-gray-500">No reservations for this month.</p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {adminReservations.map((r) => {
                        const from = r.from.toDate().toLocaleDateString("en-GB");
                        const to = r.to.toDate().toLocaleDateString("en-GB");
                      
                        return (
                          <tr key={r.id} className="border-b">
                            <td className="py-2">
                              {from} – {to}
                            </td>
                        
                            <td className="py-2 text-right">
                              {confirmingId === r.id ? (
                                <div className="flex justify-end gap-3">
                                  <button
                                    onClick={() => cancelReservation(r.id)}
                                    className="text-red-600 hover:underline"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmingId(null)}
                                    className="text-gray-500 hover:underline"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmingId(r.id)}
                                  className="text-orange-600 hover:underline"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

        </div>
      </div>
    </div>
  );
}