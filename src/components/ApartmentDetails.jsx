import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp, runTransaction } from 'firebase/firestore'
import { db } from '/public/config/firebaseinit'
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from '/public/ctx/FirebaseAuth'
import { auth } from "/public/config/firebaseinit";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

export default function ApartmentDetails() {
  const { apartmentId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [totalImages, setTotalImages] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const imagesPerPage = 1;

  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [bookedRanges, setBookedRanges] = useState([]);

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

        const ranges = snapshot.docs.map((doc) => {
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
      // Firestore Transaction
      await runTransaction(db, async (tx) => {
        const q = query(
          collection(db, "reservations"),
          where("apartmentId", "==", apartmentId)
        );
        const snapshot = await getDocs(q);

        const existingRanges = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            from: normalizeDate(data.from.toDate()),
            to: normalizeDate(data.to.toDate()),
          };
        });

        if (
          existingRanges.some(
            (r) => newRange.from <= r.to && newRange.to >= r.from
          )
        ) {
          throw new Error("Already booked in Firestore");
        }

        await addDoc(collection(db, "reservations"), {
          apartmentId,
          userId: user.uid,
          from: Timestamp.fromDate(newRange.from),
          to: Timestamp.fromDate(newRange.to),
          createdAt: Timestamp.now(),
        });
      });

      alert("Reservation successful!");

      // Block dates locally
      setBookedRanges((prev) => [...prev, newRange]);
      setRange({ from: undefined, to: undefined });
    } catch (err) {
      console.error("Reservation failed:", err);
      alert("Failed to make reservation. The range may already be booked.");
    }
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

              {/* VERIFIED USER → show reservation button */}
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

                {/* LOGGED IN BUT NOT VERIFIED → show resend button */}
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

                {/* NOT LOGGED IN → optional message */}
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
        </div>
      </div>
    </div>
  );
}