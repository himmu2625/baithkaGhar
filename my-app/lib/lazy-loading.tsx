/**
 * Advanced lazy loading system with intersection observer and performance monitoring
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  ComponentType,
  ReactNode,
} from "react"
import Image from "next/image"

// Lazy loading configuration
export interface LazyLoadConfig {
  threshold: number
  rootMargin: string
  fallback: ReactNode
  preload: boolean
  retryCount: number
  retryDelay: number
}

// Component loading state
export interface LoadingState {
  isLoading: boolean
  hasError: boolean
  error?: Error
  retryCount: number
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  networkRequests: number
}

/**
 * Lazy Loaded Component with advanced features
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: Partial<LazyLoadConfig> = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    threshold = 0.1,
    rootMargin = "50px",
    fallback = <div className="animate-pulse bg-gray-200 h-32 rounded" />,
    preload = false,
    retryCount = 3,
    retryDelay = 1000,
  } = config

  const LazyComponent = React.lazy(importFn)

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    const [state, setState] = useState<LoadingState>({
      isLoading: true,
      hasError: false,
      retryCount: 0,
    })

    const [metrics, setMetrics] = useState<PerformanceMetrics>({
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkRequests: 0,
    })

    const containerRef = useRef<HTMLDivElement>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadStartTime = useRef<number>(0)

    // Start performance monitoring
    const startPerformanceMonitoring = useCallback(() => {
      loadStartTime.current = performance.now()

      // Monitor memory usage
      if (typeof performance !== "undefined" && performance.memory) {
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: (performance as any).memory.usedJSHeapSize,
        }))
      }
    }, [])

    // End performance monitoring
    const endPerformanceMonitoring = useCallback(() => {
      const loadTime = performance.now() - loadStartTime.current
      setMetrics((prev) => ({
        ...prev,
        loadTime,
        renderTime: performance.now() - loadStartTime.current,
      }))
    }, [])

    // Handle loading success
    const handleLoadSuccess = useCallback(() => {
      setState((prev) => ({ ...prev, isLoading: false, hasError: false }))
      endPerformanceMonitoring()
    }, [endPerformanceMonitoring])

    // Handle loading error
    const handleLoadError = useCallback((error: Error) => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        hasError: true,
        error,
        retryCount: prev.retryCount + 1,
      }))
    }, [])

    // Retry loading
    const retry = useCallback(() => {
      if (state.retryCount < retryCount) {
        setState((prev) => ({ ...prev, isLoading: true, hasError: false }))
        startPerformanceMonitoring()

        // Force re-import
        setTimeout(() => {
          importFn()
            .then(() => handleLoadSuccess())
            .catch(handleLoadError)
        }, retryDelay)
      }
    }, [
      state.retryCount,
      handleLoadSuccess,
      handleLoadError,
      startPerformanceMonitoring,
    ])

    // Setup intersection observer
    useEffect(() => {
      if (!containerRef.current) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && state.isLoading) {
              startPerformanceMonitoring()

              // Load the component
              importFn()
                .then(() => handleLoadSuccess())
                .catch(handleLoadError)

              // Disconnect observer after loading
              observer.disconnect()
            }
          })
        },
        {
          threshold,
          rootMargin,
        }
      )

      observer.observe(containerRef.current)
      observerRef.current = observer

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    }, [
      state.isLoading,
      startPerformanceMonitoring,
      handleLoadSuccess,
      handleLoadError,
    ])

    // Preload if configured
    useEffect(() => {
      if (preload) {
        startPerformanceMonitoring()
        importFn()
          .then(() => handleLoadSuccess())
          .catch(handleLoadError)
      }
    }, [
      startPerformanceMonitoring,
      handleLoadSuccess,
      handleLoadError,
    ])

    return (
      <div ref={containerRef} className="lazy-load-container">
        {state.hasError ? (
          <div className="lazy-load-error">
            <div className="text-red-600 text-sm mb-2">
              Failed to load component
            </div>
            {state.retryCount < retryCount && (
              <button
                onClick={retry}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Retry ({state.retryCount}/{retryCount})
              </button>
            )}
          </div>
        ) : (
          <Suspense fallback={fallback}>
            <LazyComponent {...props} />
          </Suspense>
        )}

        {/* Performance metrics (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-500 mt-1">
            Load: {metrics.loadTime.toFixed(2)}ms | Memory:{" "}
            {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
          </div>
        )}
      </div>
    )
  }
}

/**
 * Image Lazy Loading Component
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder = "/placeholder.svg",
  threshold = 0.1,
  rootMargin = "50px",
  onLoad,
  onError,
}: {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  threshold?: number
  rootMargin?: string
  onLoad?: () => void
  onError?: () => void
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(imgRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, rootMargin])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  return (
    <div className={`lazy-image-container ${className || ""}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Error Fallback */}
      {hasError && (
        <Image
          src={placeholder}
          alt={alt}
          width={width}
          height={height}
          className="opacity-100"
        />
      )}
    </div>
  )
}

/**
 * Data Lazy Loading Hook
 */
export function useLazyData<T>(
  fetcher: () => Promise<T>,
  config: {
    enabled?: boolean
    cacheKey?: string
    cacheTTL?: number
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { enabled = true, cacheKey, cacheTTL = 5 * 60 * 1000 } = config

  // Setup intersection observer
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    )

    observer.observe(containerRef.current)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled])

  // Fetch data when in view
  useEffect(() => {
    if (!isInView || isLoading || data) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check cache first
        if (cacheKey && typeof window !== "undefined") {
          const cached = localStorage.getItem(`lazy_${cacheKey}`)
          if (cached) {
            const { value, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < cacheTTL) {
              setData(value)
              setIsLoading(false)
              return
            }
          }
        }

        const result = await fetcher()
        setData(result)

        // Cache the result
        if (cacheKey && typeof window !== "undefined") {
          localStorage.setItem(
            `lazy_${cacheKey}`,
            JSON.stringify({
              value: result,
              timestamp: Date.now(),
            })
          )
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isInView, isLoading, data, fetcher, cacheKey, cacheTTL])

  return {
    data,
    isLoading,
    error,
    containerRef,
  }
}

/**
 * Preload Manager for critical resources
 */
export class PreloadManager {
  private static instance: PreloadManager
  private preloadedResources = new Set<string>()
  private preloadQueue: Array<() => Promise<void>> = []

  static getInstance(): PreloadManager {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager()
    }
    return PreloadManager.instance
  }

  /**
   * Preload a component
   */
  async preloadComponent(importFn: () => Promise<any>): Promise<void> {
    const key = importFn.toString()
    if (this.preloadedResources.has(key)) return

    try {
      await importFn()
      this.preloadedResources.add(key)
    } catch (error) {
      console.warn("Failed to preload component:", error)
    }
  }

  /**
   * Preload an image
   */
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Preload multiple resources
   */
  async preloadResources(resources: Array<() => Promise<any>>): Promise<void> {
    const promises = resources.map((resource) =>
      this.preloadComponent(resource)
    )
    await Promise.allSettled(promises)
  }

  /**
   * Queue preload for later execution
   */
  queuePreload(preloadFn: () => Promise<void>): void {
    this.preloadQueue.push(preloadFn)
  }

  /**
   * Execute queued preloads
   */
  async executeQueuedPreloads(): Promise<void> {
    const promises = this.preloadQueue.map((fn) => fn())
    this.preloadQueue = []
    await Promise.allSettled(promises)
  }
}

// Export singleton instance
export const preloadManager = PreloadManager.getInstance()

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
  })

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measurePerformance = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))

        setMetrics((prev) => ({
          ...prev,
          fps,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        }))

        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measurePerformance)
    }

    requestAnimationFrame(measurePerformance)
  }, [])

  return metrics
}
