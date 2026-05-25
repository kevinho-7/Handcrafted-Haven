'use client';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  setRating: (n: number) => void;
  comment: string;
  setComment: (s: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  editMode?: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  rating,
  setRating,
  comment,
  setComment,
  submitting,
  onSubmit,
  editMode = false,
}: ReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className="p-6 rounded shadow-lg w-full max-w-md"
        style={{ backgroundColor: "var(--rust)" }}   // <-- HERE
      >
        <h2 className="text-xl font-semibold mb-4 text-white">
          {editMode ? 'Edit Your Review' : 'Leave a Review'}
        </h2>

        {/* Rating Input */}
        <label className="block text-sm mb-2 font-medium text-white">Rating (1–5)</label>
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="
            border border-gray-200 
            bg-white
            rounded 
            px-3 py-2 
            w-24 
            mb-4
            focus:outline-none 
            focus:ring-2 
            focus:ring-white
          "
        />

        {/* Comment Box */}
        <label className="block text-sm mb-2 font-medium text-white">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="
            border border-gray-200 
            bg-white
            rounded 
            px-3 py-2 
            w-full 
            h-28 
            resize-none 
            focus:outline-none 
            focus:ring-2 
            focus:ring-white
            mb-4
          "
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-white text-[var(--rust)] px-4 py-2 rounded font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : (editMode ? 'Update Review' : 'Submit Review')}
          </button>
        </div>
      </div>
    </div>
  );
}
