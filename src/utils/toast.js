// Utilitaire pour afficher des toasts avec Toastify

export function showToast(message, type = "default") {
  const backgrounds = {
    success: "linear-gradient(135deg, #2ecc71, #27ae60)",
    error: "linear-gradient(135deg, #e74c3c, #c0392b)",
    info: "linear-gradient(135deg, #3498db, #2980b9)",
    default: "linear-gradient(135deg, #555, #333)",
  };

  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "right",
    style: {
      background: backgrounds[type] || backgrounds.default,
      borderRadius: "8px",
      fontFamily: "inherit",
      fontSize: "14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    },
    stopOnFocus: true,
  }).showToast();
}
