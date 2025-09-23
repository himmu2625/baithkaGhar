'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SupportedLanguage, TranslationData, translations } from './translations'

interface I18nContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: TranslationData
  isRTL: boolean
  supportedLanguages: Array<{
    code: SupportedLanguage
    name: string
    nativeName: string
    flag: string
  }>
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (amount: number, currency?: string) => string
  getPreferredLanguage: () => SupportedLanguage
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const supportedLanguages = [
  { code: 'en' as const, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es' as const, name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr' as const, name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de' as const, name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as const, name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt' as const, name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh' as const, name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja' as const, name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko' as const, name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar' as const, name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi' as const, name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru' as const, name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
]

const rtlLanguages: SupportedLanguage[] = ['ar']

interface I18nProviderProps {
  children: ReactNode
  defaultLanguage?: SupportedLanguage
}

export function I18nProvider({ children, defaultLanguage = 'en' }: I18nProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage)

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferred-language') as SupportedLanguage
    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      setLanguageState(savedLanguage)
    } else {
      // Detect browser language
      const browserLanguage = detectBrowserLanguage()
      setLanguageState(browserLanguage)
    }
  }, [])

  const detectBrowserLanguage = (): SupportedLanguage => {
    if (typeof window === 'undefined') return defaultLanguage

    const browserLang = navigator.language.toLowerCase()

    // Check for exact match
    for (const lang of supportedLanguages) {
      if (browserLang === lang.code || browserLang.startsWith(lang.code + '-')) {
        return lang.code
      }
    }

    // Check for language family matches
    const langFamily = browserLang.split('-')[0]
    for (const lang of supportedLanguages) {
      if (lang.code === langFamily) {
        return lang.code
      }
    }

    return defaultLanguage
  }

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang)
    localStorage.setItem('preferred-language', lang)

    // Update document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr'
    }
  }

  const getPreferredLanguage = (): SupportedLanguage => {
    return language
  }

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }

    return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(dateObj)
  }

  const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    }

    return new Intl.DateTimeFormat(language, { ...defaultOptions, ...options }).format(dateObj)
  }

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(language, options).format(number)
  }

  const formatCurrency = (amount: number, currency?: string): string => {
    const currencyCode = currency || getCurrencyForLanguage(language)
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currencyCode
    }).format(amount)
  }

  const getCurrencyForLanguage = (lang: SupportedLanguage): string => {
    const currencyMap: Record<SupportedLanguage, string> = {
      en: 'USD',
      es: 'EUR',
      fr: 'EUR',
      de: 'EUR',
      it: 'EUR',
      pt: 'EUR',
      zh: 'CNY',
      ja: 'JPY',
      ko: 'KRW',
      ar: 'USD',
      hi: 'INR',
      ru: 'RUB'
    }
    return currencyMap[lang] || 'USD'
  }

  // Get translations with fallback to English
  const getTranslations = (lang: SupportedLanguage): TranslationData => {
    const translation = translations[lang]

    // If translation doesn't exist or is incomplete, merge with English
    if (!translation || Object.keys(translation).length === 0) {
      return translations.en
    }

    // Deep merge with English fallback for missing keys
    return mergeTranslations(translations.en, translation)
  }

  const mergeTranslations = (fallback: TranslationData, target: Partial<TranslationData>): TranslationData => {
    const result = { ...fallback }

    Object.keys(target).forEach(key => {
      const targetValue = target[key as keyof TranslationData]
      const fallbackValue = fallback[key as keyof TranslationData]

      if (targetValue && typeof targetValue === 'object' && typeof fallbackValue === 'object') {
        result[key as keyof TranslationData] = { ...fallbackValue, ...targetValue } as any
      } else if (targetValue) {
        result[key as keyof TranslationData] = targetValue as any
      }
    })

    return result
  }

  const value: I18nContextType = {
    language,
    setLanguage,
    t: getTranslations(language),
    isRTL: rtlLanguages.includes(language),
    supportedLanguages,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    getPreferredLanguage
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Higher-order component for class components
export function withI18n<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    const i18n = useI18n()
    return <Component {...props} {...i18n} />
  }
}

// Hook for translation with interpolation
export function useTranslation() {
  const { t, language, formatDate, formatTime, formatNumber, formatCurrency } = useI18n()

  const translate = (
    key: string,
    values?: Record<string, string | number>,
    options?: {
      fallback?: string
      count?: number
    }
  ): string => {
    // Navigate through nested translation object
    const keys = key.split('.')
    let translation: any = t

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k]
      } else {
        return options?.fallback || key
      }
    }

    if (typeof translation !== 'string') {
      return options?.fallback || key
    }

    // Handle pluralization
    if (options?.count !== undefined) {
      // Simple pluralization logic - can be enhanced
      if (options.count === 1) {
        return translation
      } else {
        // Try to find plural form or add 's' for English
        const pluralKey = key + '_plural'
        const pluralKeys = pluralKey.split('.')
        let pluralTranslation: any = t

        for (const k of pluralKeys) {
          if (pluralTranslation && typeof pluralTranslation === 'object' && k in pluralTranslation) {
            pluralTranslation = pluralTranslation[k]
          } else {
            break
          }
        }

        if (typeof pluralTranslation === 'string') {
          translation = pluralTranslation
        } else if (language === 'en') {
          translation = translation + 's'
        }
      }
    }

    // Interpolate values
    if (values) {
      Object.keys(values).forEach(valueKey => {
        const placeholder = `{${valueKey}}`
        translation = translation.replace(new RegExp(placeholder, 'g'), String(values[valueKey]))
      })
    }

    return translation
  }

  return {
    t: translate,
    language,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency
  }
}

// Language detection utilities
export const LanguageUtils = {
  detectUserLanguage: (): SupportedLanguage => {
    if (typeof window === 'undefined') return 'en'

    // Check saved preference
    const saved = localStorage.getItem('preferred-language') as SupportedLanguage
    if (saved && supportedLanguages.some(lang => lang.code === saved)) {
      return saved
    }

    // Check browser language
    const browserLang = navigator.language.toLowerCase()

    for (const lang of supportedLanguages) {
      if (browserLang === lang.code || browserLang.startsWith(lang.code + '-')) {
        return lang.code
      }
    }

    const langFamily = browserLang.split('-')[0]
    for (const lang of supportedLanguages) {
      if (lang.code === langFamily) {
        return lang.code
      }
    }

    return 'en'
  },

  getLanguageDirection: (lang: SupportedLanguage): 'ltr' | 'rtl' => {
    return rtlLanguages.includes(lang) ? 'rtl' : 'ltr'
  },

  getLanguageInfo: (lang: SupportedLanguage) => {
    return supportedLanguages.find(l => l.code === lang)
  },

  isRTL: (lang: SupportedLanguage): boolean => {
    return rtlLanguages.includes(lang)
  }
}