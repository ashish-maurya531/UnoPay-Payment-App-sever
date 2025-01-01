
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { timeZone: 'Asia/Kolkata', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('en-IN', options).replace(',', ' ');
  };