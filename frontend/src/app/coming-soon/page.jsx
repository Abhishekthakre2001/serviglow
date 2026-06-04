export default function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200  to-orange-200 px-6">

      <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-lg p-12 text-center max-w-2xl w-full">

        {/* Brand Name */}
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="ServiGlow"
            className="h-20 my-4"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/default_img.webp";
            }}

          />
        </div>


        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
          Coming Soon
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">
          We're upgrading this section to serve you better.
          <br />
          Stay tuned — something amazing is on the way!
        </p>

        {/* Decorative Line */}
        <div className="mt-8 flex justify-center">
          <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full"></div>
        </div>

      </div>

    </div>
  );
}
