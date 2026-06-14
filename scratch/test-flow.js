import { addInvestor, getInvestors, addShareToInvestor, sellSharesFromInvestor, deleteInvestor } from '../src/db.js';

const runSimulation = async () => {
  try {
    console.log("=== Starting Simulation ===");

    // 1. Add Investor
    console.log("1. Adding a test investor...");
    const testInvestor = {
      name: "Test Simulation",
      email: "test@example.com",
      phone: "01711223344",
      joiningDate: new Date().toISOString().split('T')[0],
      activationDate: new Date().toISOString().split('T')[0],
      status: "Active",
      paymentMethod: "Cash",
      shares: 2
    };
    
    const addedInvestor = await addInvestor(testInvestor);
    console.log("-> Success! Added Investor ID:", addedInvestor.id, "with Trx ID:", addedInvestor.trxId);

    // 2. Get Investors
    console.log("2. Fetching investors...");
    const investors = await getInvestors();
    const found = investors.find(i => i.id === addedInvestor.id);
    if (!found) {
      throw new Error("Failed to find the newly added investor!");
    }
    console.log("-> Success! Found investor with shares:", found.shares, "Amount:", found.amount);

    // 3. Add Share to Investor
    console.log("3. Adding 1 new share to the investor...");
    const newShare = {
      shares: 1,
      joiningDate: new Date().toISOString().split('T')[0],
      activationDate: new Date().toISOString().split('T')[0],
      status: "Active",
      paymentMethod: "Bank"
    };
    const buyTxId = await addShareToInvestor(addedInvestor.id, newShare);
    console.log("-> Success! New share added with Trx ID:", buyTxId);

    // 4. Verify Total Shares
    const updatedInvestors = await getInvestors();
    const updatedFound = updatedInvestors.find(i => i.id === addedInvestor.id);
    console.log("-> Verified total shares. Expected: 3, Actual:", updatedFound.shares);
    if (updatedFound.shares !== 3) {
      throw new Error("Total shares did not update correctly!");
    }

    // 5. Sell Shares
    // NOTE: Selling requires Reserve Fund to have enough money. 
    // Since we reset funds to 0, selling should throw an Error "Insufficient funds" from Reserve.
    console.log("5. Attempting to sell 1 share (Should fail due to 0 reserve fund)...");
    try {
      await sellSharesFromInvestor(addedInvestor.id, 1, "System Simulation");
      console.log("-> Warning: Selling succeeded unexpectedly (Funds should be empty!)");
    } catch (err) {
      console.log("-> Success! Caught expected error:", err.message);
    }

    // 6. Delete Investor
    console.log("6. Cleaning up: Deleting test investor...");
    await deleteInvestor(addedInvestor.id, updatedFound.amount);
    console.log("-> Success! Test investor deleted.");

    console.log("=== Simulation Completed Successfully ===");
    process.exit(0);
  } catch (err) {
    console.error("Simulation failed:", err);
    process.exit(1);
  }
};

runSimulation();
