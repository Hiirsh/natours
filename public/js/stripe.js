import axios from "axios"

const stripe = Stripe('pk_test_51LotI7KhPYCp7t82tYFwchgJYNKvidjSLjpSCwcRBAoaQXhUvID69fJMXY6EGHBI3YUl22glGlmEOkVreKLXyFzu00tdakVqD8')

export const bookTour = async tourId => {
  const session = await axios(`http://127.0.0.1:3000/bookings/checkout-session/${tourId}`)
  console.log(session)
}