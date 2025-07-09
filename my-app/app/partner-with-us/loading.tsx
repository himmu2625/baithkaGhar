export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section Skeleton */}
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8 animate-pulse">
            {/* Badge skeleton */}
            <div className="inline-block bg-white/20 rounded-full px-4 py-2 w-64 h-8"></div>
            
            {/* Title skeleton */}
            <div className="space-y-4">
              <div className="bg-white/20 rounded-lg h-16 w-full max-w-4xl mx-auto"></div>
              <div className="bg-white/20 rounded-lg h-16 w-3/4 max-w-3xl mx-auto"></div>
            </div>
            
            {/* Subtitle skeleton */}
            <div className="space-y-2">
              <div className="bg-white/20 rounded-lg h-6 w-2/3 max-w-2xl mx-auto"></div>
              <div className="bg-white/20 rounded-lg h-6 w-1/2 max-w-xl mx-auto"></div>
            </div>
            
            {/* Stats skeleton */}
            <div className="flex justify-center gap-8 pt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="bg-white/20 rounded-lg h-10 w-20 mb-2 mx-auto"></div>
                  <div className="bg-white/20 rounded-lg h-4 w-16 mx-auto"></div>
                </div>
              ))}
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex justify-center gap-4 pt-8">
              <div className="bg-white/20 rounded-full h-12 w-40"></div>
              <div className="bg-white/20 rounded-full h-12 w-32"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content sections skeleton */}
      <div className="space-y-16 py-16">
        {[1, 2, 3, 4].map((section) => (
          <div key={section} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-pulse">
              <div className="bg-gray-200 rounded-lg h-12 w-2/3 max-w-2xl mx-auto mb-4"></div>
              <div className="bg-gray-200 rounded-lg h-6 w-1/2 max-w-xl mx-auto"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="bg-gray-200 rounded-xl h-64"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 