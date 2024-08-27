export const convertDate = (dateInput) => {
  if (typeof dateInput === 'number') {
    // Date is already in timestamp format
    return new Date(dateInput).toLocaleString();
  }

  const [datePart, timePart] = dateInput.split(", ");
  const [month, day, year] = datePart.split("/").map(Number);

  let hours = 0, minutes = 0, seconds = 0;
  if (timePart) {
    const [time, period] = timePart.split(" ");
    [hours, minutes, seconds] = time.split(":").map(Number);
    
    if (period && period.toLowerCase() === "pm" && hours !== 12) {
      hours += 12;
    } else if (period && period.toLowerCase() === "am" && hours === 12) {
      hours = 0;
    }
  }

  return new Date(year, month - 1, day, hours, minutes, seconds);
};