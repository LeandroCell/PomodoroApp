import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file customizes the static HTML shell used for the web export. It only runs at build
// time, so it can safely use plain <head> tags for PWA metadata, theme color and icons.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <title>Pomodoro Brew</title>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="A focused Pomodoro timer with a brewing coffee cup, offline stats and cross-platform notifications." />
        <meta name="theme-color" content="#8B5E3C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pomodoro Brew" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/favicon.png" />

        {process.env.NODE_ENV === 'production' ? (
          <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
        ) : null}

        {/* react-native-web resets some scroll behavior; this keeps native-feeling momentum scroll on web. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
  html, body { background-color: #FBF6EF; height: 100%; }
  @media (prefers-color-scheme: dark) {
    html, body { background-color: #26160C; }
  }
`;

const registerServiceWorker = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').catch(function () {});
    });
  }
`;
