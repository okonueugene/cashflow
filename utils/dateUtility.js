export const convertDate = (dateInput) => {
  if (typeof dateInput === 'number') {
    // Date is already in timestamp format
    return new Date(dateInput).toLocaleString();
  }

  if (typeof dateInput === 'string') {
    let datePart, timePart;

    if (dateInput.includes(", ")) {
      // Case 1: "MM/DD/YYYY, HH:MM:SS AM/PM"
      [datePart, timePart] = dateInput.split(", ");
    } else {
      // Case 2: "MM/DD/YYYY"
      datePart = dateInput;
      timePart = "12:00:00 AM"; // Default to midnight if time is not provided
    }

    const [month, day, year] = datePart.split("/").map(Number);
    let [time, period] = timePart.split(" ");
    let [hours, minutes, seconds] = time.split(":").map(Number);

    if (period?.toLowerCase() === "pm" && hours !== 12) {
      hours += 12;
    } else if (period?.toLowerCase() === "am" && hours === 12) {
      hours = 0;
    }

    return new Date(year, month - 1, day, hours, minutes || 0, seconds || 0).toLocaleString();
  }

  return dateInput;
};
