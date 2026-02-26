
# YDTechPro: Professional Integration Guide (Finalized)

Your environment is now pre-configured with the credentials you provided.

## Phase 1: Database Setup
1. **Start XAMPP**: Ensure Apache and MySQL are running.
2. **Database Creation**: Create a database named `ydtechpro` in phpMyAdmin.
3. **Import Schema**: Import the `schema.sql` (or `database/schema.sql`) file.

## Phase 2: Integrated Credentials
The following credentials have been injected into the code:

### Google Login
- **Client ID**: `997490229104-t4d3napj1dlm3rf8lqlitpgeu6l1jrbd.apps.googleusercontent.com`
- **Location**: `components/Login.tsx`
- **Note**: The *Client Secret* (`GOCSPX...`) is for server-side verification. In this version, we use the identity payload directly for the prototype.

### Razorpay Payments
- **Test Key ID**: `rzp_test_SHXfrlOlUt0sKH`
- **Location**: `services/razorpayService.ts`
- **Note**: The *Key Secret* (`MKrg2i...`) is required if you implement webhook verification in `backend/server.js`.

## Phase 3: Launching the App
1. **Open Terminal 1 (Backend)**:
   ```bash
   npm run server
   ```
   *Expect: "[GOVERNANCE] Auth & Market Engine Active on Port 3001"*

2. **Open Terminal 2 (Frontend)**:
   ```bash
   npm start
   ```

## Workflow Summary
1. **Login**: Use the "Continue with Google" button. If it's your first time, you'll be asked to select roles (Buyer/Seller/Technician).
2. **Seller Verification**: If you choose the Seller role, an Admin must approve you via the Admin Panel before you can post products.
3. **Lead Negotiation**: Buyers can start negotiations on products. 
4. **Governance Fee**: Once a price is agreed, the Buyer pays ₹25 via the Razorpay modal to "Lock" the lead.
5. **Finalization**: After both parties fulfill governance requirements, the Admin closes the lead, unlocking final contact details.
