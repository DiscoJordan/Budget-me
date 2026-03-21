/**
 * Formats a number with space-separated thousands and trims trailing decimal zeros.
 * @param num
 * @returns formatted string
 */
export const formatNumber = (num: number): string => {
  var fixed = Number(num).toFixed(2);
  var parts = fixed.split(".");
  var integerPart = parts[0];
  var formattedIntegerPart = "";

  for (var i = integerPart.length - 1; i >= 0; i--) {
    formattedIntegerPart = integerPart.charAt(i) + formattedIntegerPart;
    if ((integerPart.length - i) % 3 === 0 && i !== 0) {
      formattedIntegerPart = " " + formattedIntegerPart;
    }
  }

  var fractionalPart = parts[1] || "";
  while (
    fractionalPart.length > 0 &&
    fractionalPart[fractionalPart.length - 1] === "0"
  ) {
    fractionalPart = fractionalPart.slice(0, -1);
  }

  if (fractionalPart.length > 0) {
    return formattedIntegerPart + "." + fractionalPart;
  } else {
    return formattedIntegerPart;
  }
};
