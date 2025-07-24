function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center my-4">
      <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full shadow-sm">
        {date}
      </div>
    </div>
  );
}

export default DateSeparator;
