// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// Helper: trims, lowercases and collapses extra spaces
function normalise(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// 1. searchNotes: notes whose text contains the word (ignores case)
function searchNotes(word) {
  const term = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(term));
}

// 2. longestNote: the note with the most characters, or null when empty
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// 3. countByCategory: counts notes per category
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category] += 1;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

// 4. getSummary: a sentence built from countByCategory
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  if (total === 0) {
    return "0 notes.";
  }
  const label = total === 1 ? "note" : "notes";
  const parts = ["personal", "work", "study"]
    .filter((category) => counts[category])
    .map((category) => `${counts[category]} ${category}`);
  return `${total} ${label}: ${parts.join(", ")}.`;
}

// 5. isDuplicate: true when a note with the same text already exists
function isDuplicate(text) {
  const target = normalise(text);
  return notes.some((note) => normalise(note.text) === target);
}

// 6. addNote: adds a valid note and returns true, otherwise logs the reason and returns false
function addNote(text, category) {
  const allowed = ["personal", "work", "study"];
  const cleaned = text.trim();

  if (cleaned.length < 1 || cleaned.length > 200) {
    console.log("Rejected: a note needs 1 to 200 characters.");
    return false;
  }
  if (isDuplicate(cleaned)) {
    console.log("Rejected: that note already exists.");
    return false;
  }
  if (!allowed.includes(category)) {
    console.log("Rejected: category must be personal, work or study.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map((note) => note.id)) + 1 : 1;
  notes.push({ id: newId, text: cleaned, category: category });
  console.log(`Added note ${newId}.`);
  return true;
}

// ---------- Tests ----------

// searchNotes
console.log(searchNotes("the"));
// Expected: array with note 2 (Finish the Day 3 assignment) and note 3 (Email the project report to Grace)
console.log(searchNotes("MILK"));
// Expected: array with note 1 only (search ignores case)
console.log(searchNotes("zebra"));
// Expected: [] (no results)

// longestNote
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
const backup = notes;
notes = [];
console.log(longestNote());
// Expected: null (empty array)
notes = backup;

// countByCategory
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }
notes = [];
console.log(countByCategory());
// Expected: {} (empty array)
notes = backup;

// getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."
notes = [backup[0]];
console.log(getSummary());
// Expected: "1 note: 1 personal."
notes = [];
console.log(getSummary());
// Expected: "0 notes."
notes = backup;

// isDuplicate
console.log(isDuplicate("buy milk and bread"));
// Expected: true (ignores case)
console.log(isDuplicate("  CALL    MUM  "));
// Expected: true (ignores case and extra spaces)
console.log(isDuplicate("Water the plants"));
// Expected: false (new text)

// addNote
console.log(addNote("Water the plants", "personal"));
// Expected: logs "Added note 6." then prints true
console.log(addNote("water the plants", "personal"));
// Expected: logs "Rejected: that note already exists." then prints false
console.log(addNote("", "work"));
// Expected: logs "Rejected: a note needs 1 to 200 characters." then prints false
console.log(addNote("a".repeat(201), "work"));
// Expected: logs "Rejected: a note needs 1 to 200 characters." then prints false
console.log(addNote("Go to the gym", "fitness"));
// Expected: logs "Rejected: category must be personal, work or study." then prints false
console.log(getSummary());
// Expected: "6 notes: 3 personal, 1 work, 2 study."