/**
 * Loading indicator component
 * Displays a spinner when content is loading
 */
function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default Loading;
