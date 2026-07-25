import ReactGA from 'react-ga4';

// Google Analytics Initialization
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    ReactGA.initialize(measurementId);
    console.log('Google Analytics initialized.');
  } else {
    console.debug('[Analytics] Local dev mode: GA Measurement ID not set in .env');
  }
};

// Send page view to GA
export const logPageView = (path) => {
  if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

// Microsoft Clarity Injection
export const initClarity = () => {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (projectId) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", projectId);
    console.log('Microsoft Clarity initialized.');
  } else {
    console.debug('[Analytics] Local dev mode: Microsoft Clarity Project ID not set in .env');
  }
};
