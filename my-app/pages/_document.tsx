import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/Logo-header.svg" />
        <link rel="icon" type="image/svg+xml" sizes="48x48" href="/Logo-header.svg" />
        <link rel="shortcut icon" type="image/svg+xml" sizes="48x48" href="/Logo-header.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Logo-header.svg" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 