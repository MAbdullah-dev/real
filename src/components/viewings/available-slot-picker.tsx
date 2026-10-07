"use client";

export function AvailableSlotPicker({
  slots,
  value,
  onChange,
  disabled,
}: {
  slots: string[];
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  if (slots.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        The owner has not published any viewing times yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <label
          key={slot}
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm has-[:checked]:border-primary"
        >
          <input
            type="radio"
            name="available-slot"
            className="accent-primary"
            checked={value === slot}
            disabled={disabled}
            onChange={() => onChange(slot)}
          />
          <span>
            {new Date(slot).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </label>
      ))}
    </div>
  );
}
