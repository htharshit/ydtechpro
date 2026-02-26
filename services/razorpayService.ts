
import { Order, User } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const razorpayService = {
  // CONFIG: Integrated your provided test key
  KEY_ID: 'rzp_test_SHXfrlOlUt0sKH', 

  openCheckout: (order: Order, user: User, onFinish: (paymentId: string) => void) => {
    // Total amount in Paisa (1 INR = 100 Paisa)
    const amountInPaisa = Math.round((order.finalPrice || order.budget || 25) * 100);
    
    const options = {
      key: razorpayService.KEY_ID,
      amount: amountInPaisa,
      currency: "INR",
      name: "YDTechPro Governance",
      description: `Finalization for: ${order.serviceName}`,
      image: "https://cdn-icons-png.flaticon.com/512/1067/1067566.png", 
      handler: function (response: any) {
        if (response.razorpay_payment_id) {
          onFinish(response.razorpay_payment_id);
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone
      },
      notes: {
        order_id: order.id,
        user_id: user.id,
        context: "Market Governance Protocol"
      },
      theme: {
        color: "#4f46e5" // Indigo-600
      },
      modal: {
        ondismiss: function() {
          console.log("Payment window closed by user.");
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Error: ${response.error.description}`);
      });
      rzp.open();
    } catch (e) {
      alert("Razorpay SDK not loaded. Ensure you have an internet connection and the script is in index.html");
    }
  }
};
