export default function Map() {
  return (
    <div className="mt-8 w-full overflow-hidden rounded-xl shadow-lg">
      <iframe
        title="Villa Rai Location"
        width="100%"
        height="350"
        // style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=41.665872, 24.159480&z=16&output=embed`}
      />
    </div>
  );
}
