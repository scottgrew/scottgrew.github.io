// USC's interlocking SC, single-colour, for the affiliation on the About
// page. The letterform path is from the SC mark on Wikimedia Commons
// (File:USC_Trojans_logo.svg), drawn in the current text colour without the
// gold outline so it sits in the site's monochrome.
export function USCMark({ height }: { height: number }) {
  return (
    <svg height={height} viewBox="4 3.8 115 172.4" role="img" aria-label="USC">
      <path fill="currentColor" d="m20.289 3.8457l-16.178 16.175 0.0003 35.108 16.174 16.176h45.385v26.269h-5.676v20.596h11.764l16.178-16.18v-35.101l-16.174-16.176-45.387-0.002v-26.273h39.295v15.976h22.266v-20.391l-16.174-16.177-51.473-0.0003zm30.777 70.297l-16.175 16.173v0.002 71.672l16.173 16.18h51.476l16.18-16.18v-20.39h-22.271v15.98h-39.295v-62.844h5.68v-20.591l-11.768-0.002zm39.707 0v20.593h5.678v15.974h22.269v-20.39l-16.18-16.177h-11.767zm-86.662 7.459v20.388l16.174 16.18h11.77v-20.596h-5.68v-15.972h-22.264z" />
    </svg>
  );
}
