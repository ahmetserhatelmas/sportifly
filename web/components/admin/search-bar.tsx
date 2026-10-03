export function SearchBar({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full max-w-md rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white"
      >
        Ara
      </button>
    </form>
  );
}
