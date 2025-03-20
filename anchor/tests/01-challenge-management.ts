import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { TestHelpers } from "./utils/helpers";

describe("step-buddy challenge management", () => {
  // Setup test environment
  before(async () => {
    TestHelpers.initialize();
  });

  it("Initializes a challenge", async () => {
    // Create a new challenge with default settings
    const fixture = await TestHelpers.createChallenge();

    // Fetch challenge account to verify initialization
    const challengeAccount = await TestHelpers.program.account.challenge.fetch(
      fixture.challengePDA
    );

    // Verify challenge data
    expect(challengeAccount.challengeId.toString()).to.equal(
      fixture.id.toString()
    );
    expect(challengeAccount.authority.toString()).to.equal(
      TestHelpers.wallet.publicKey.toString()
    );
    expect(challengeAccount.stepGoal).to.equal(fixture.stepGoal);
    expect(challengeAccount.durationDays).to.equal(fixture.durationDays);
    expect(challengeAccount.entryAmount.toString()).to.equal(
      fixture.entryAmount.toString()
    );
    expect(challengeAccount.maxParticipants).to.equal(fixture.maxParticipants);
    expect(challengeAccount.participantCount).to.equal(0);
    expect(challengeAccount.totalPool.toString()).to.equal("0");
    expect(challengeAccount.isActive).to.be.true;
    expect(challengeAccount.isCompleted).to.be.false;
    expect(challengeAccount.successfulParticipants).to.equal(0);

    console.log("Challenge initialized successfully!");
  });

  it("Allows a user to join the challenge", async () => {
    // Get or create a challenge fixture
    const fixture = await TestHelpers.getOrCreateChallenge("joinTest");

    // Get a test user
    const user = await TestHelpers.getOrCreateUser("joinUser");

    // Retrieve initial balances
    const initialVaultBalance =
      await TestHelpers.provider.connection.getBalance(fixture.vaultPDA);
    const initialUserBalance = await TestHelpers.provider.connection.getBalance(
      user.publicKey
    );

    // Find the participant PDA
    const [participantPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        user.publicKey.toBuffer(),
        fixture.id.toBuffer("le", 8),
      ],
      TestHelpers.program.programId
    );

    // Join the challenge
    await TestHelpers.program.methods
      .joinChallenge(fixture.id)
      .accountsPartial({
        challenge: fixture.challengePDA,
        participant: participantPDA,
        user: user.publicKey,
        vault: fixture.vaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Verify participant account was created correctly
    const participantAccount =
      await TestHelpers.program.account.participant.fetch(participantPDA);
    expect(participantAccount.wallet.toString()).to.equal(
      user.publicKey.toString()
    );
    expect(participantAccount.challengeId.toString()).to.equal(
      fixture.id.toString()
    );
    expect(participantAccount.dailyCompletions.length).to.equal(
      fixture.durationDays
    );
    expect(participantAccount.totalSuccessfulDays).to.equal(0);
    expect(participantAccount.hasWithdrawn).to.be.false;

    // Check that challenge was updated
    const challengeAccount = await TestHelpers.program.account.challenge.fetch(
      fixture.challengePDA
    );
    expect(challengeAccount.participantCount).to.equal(1);
    expect(challengeAccount.totalPool.toString()).to.equal(
      fixture.entryAmount.toString()
    );

    // Check that funds were transferred to vault
    const finalVaultBalance = await TestHelpers.provider.connection.getBalance(
      fixture.vaultPDA
    );
    const finalUserBalance = await TestHelpers.provider.connection.getBalance(
      user.publicKey
    );

    expect(finalVaultBalance - initialVaultBalance).to.equal(
      fixture.entryAmount.toNumber()
    );
    expect(initialUserBalance - finalUserBalance).to.be.greaterThanOrEqual(
      fixture.entryAmount.toNumber()
    );

    console.log("User joined challenge successfully!");

    // Add to challenge fixture for future tests
    fixture.participants.push({
      user,
      participantPDA,
      userName: "joinUser",
    });
  });

  it("Prevents joining an already full challenge", async () => {
    // Create a challenge with only 1 participant allowed
    const fixture = await TestHelpers.createChallenge({
      maxParticipants: 1,
    });

    // First user joins (should succeed)
    const firstUser = await TestHelpers.getOrCreateUser("fullTestUser1");
    await TestHelpers.addParticipant(fixture, "fullTestUser1");

    // Second user tries to join (should fail)
    const secondUser = await TestHelpers.getOrCreateUser("fullTestUser2");

    const [secondParticipantPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        secondUser.publicKey.toBuffer(),
        fixture.id.toBuffer("le", 8),
      ],
      TestHelpers.program.programId
    );

    try {
      await TestHelpers.program.methods
        .joinChallenge(fixture.id)
        .accountsPartial({
          challenge: fixture.challengePDA,
          participant: secondParticipantPDA,
          user: secondUser.publicKey,
          vault: fixture.vaultPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([secondUser])
        .rpc();

      expect.fail("Should not be able to join a full challenge");
    } catch (error) {
      expect(error.toString()).to.include("ChallengeFull");
      console.log("Successfully prevented joining a full challenge");
    }
  });
});
