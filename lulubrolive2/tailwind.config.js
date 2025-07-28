/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'supabase-blue': '#3290EE',
        'supabase-dark': '#1E293B',
        'supabase-gray': '#334155',
      },
      keyframes: {
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        spin: 'spin 1s linear infinite',
      }
    },
  },
  plugins: [
    require('autoprefixer'),
    // Tailwind CSS에서 기본적으로 제공하는 기능 외에 추가적인 스타일링이 필요할 경우 여기에 플러그인을 추가할 수 있습니다.
    // 예: require('@tailwindcss/forms'), require('@tailwindcss/typography')
  ],
};
