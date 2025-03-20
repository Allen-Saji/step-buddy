import { expect } from "chai";
import {
  TestHelpers,
  ChallengeFixture,
  ParticipantFixture,
} from "./utils/helpers";

describe("step-buddy verification", () => {
  // Challenge and participants for this test suite
  let verificationChallenge: ChallengeFixture;
  let user1: ParticipantFixture;
  let user2: ParticipantFixture;

  before(async () => {
    // Initialize test helpers
    TestHelpers.initialize();

    // Create a challenge with a shorter duration for testing
    verificationChallenge = await TestHelpers.createChallenge({
      durationDays: 3, // Shorter duration for testing
    });

    // Add two users to the challenge
    user1 = await TestHelpers.addParticipant(
      verificationChallenge,
      "verificationUser1"
    );
    user2 = await TestHelpers.addParticipant(
      verificationChallenge,
      "verificationUser2"
    );

    // Verify setup
    const challengeAccount = await TestHelpers.program.account.challenge.fetch(
      verificationChallenge.challengePDA
    );
    expect(challengeAccount.participantCount).to.equal(2);
  });

  it("Allows a user to submit verification meeting step goal", async () => {
    // User 1 submits a verification that meets the step goal for day 0
    const day = 0;
    const stepCount = verificationChallenge.stepGoal + 500; // Exceeds goal

    await TestHelpers.submitVerification(
      verificationChallenge,
      user1,
      stepCount,
      day
    );

    // Verify participant account was updated
    const participantAccount =
      await TestHelpers.program.account.participant.fetch(user1.participantPDA);

    expect(participantAccount.dailyCompletions[day]).to.be.true;
    expect(participantAccount.totalSuccessfulDays).to.equal(1);

    console.log("Successfully submitted verification");
  });

  it("Handles step counts below the goal", async () => {
    // User 2 submits a verification that doesn't meet the step goal
    const day = 0;
    const stepCount = verificationChallenge.stepGoal - 500; // Below goal

    await TestHelpers.submitVerification(
      verificationChallenge,
      user2,
      stepCount,
      day
    );

    // Verify participant account was not updated for success
    const participantAccount =
      await TestHelpers.program.account.participant.fetch(user2.participantPDA);

    expect(participantAccount.dailyCompletions[day]).to.be.false;
    expect(participantAccount.totalSuccessfulDays).to.equal(0);

    console.log("Correctly handled verification below step goal");
  });

  it("Handles multiple verifications for different days", async () => {
    // User 1 submits verifications for remaining days
    for (let day = 1; day < verificationChallenge.durationDays; day++) {
      await TestHelpers.submitVerification(
        verificationChallenge,
        user1,
        verificationChallenge.stepGoal + 100,
        day
      );
    }

    // Verify all days are marked as complete
    const participantAccount =
      await TestHelpers.program.account.participant.fetch(user1.participantPDA);

    for (let day = 0; day < verificationChallenge.durationDays; day++) {
      expect(participantAccount.dailyCompletions[day]).to.be.true;
    }

    expect(participantAccount.totalSuccessfulDays).to.equal(
      verificationChallenge.durationDays
    );

    console.log("Successfully verified multiple days");
  });

  it("Prevents verification for invalid days", async () => {
    // Try to verify a day outside the challenge duration
    const invalidDay = verificationChallenge.durationDays;

    try {
      await TestHelpers.submitVerification(
        verificationChallenge,
        user1,
        verificationChallenge.stepGoal,
        invalidDay
      );

      expect.fail("Should not allow verification for an invalid day");
    } catch (error) {
      expect(error.toString()).to.include("InvalidVerificationDay");
      console.log("Successfully prevented verification for invalid day");
    }
  });

  it("Handles duplicate verifications for the same day", async () => {
    // User 2 submits a successful verification for day 1
    const day = 1;
    const firstStepCount = verificationChallenge.stepGoal + 200;

    await TestHelpers.submitVerification(
      verificationChallenge,
      user2,
      firstStepCount,
      day
    );

    // Get current successful days
    const firstCheck = await TestHelpers.program.account.participant.fetch(
      user2.participantPDA
    );
    const initialSuccessfulDays = firstCheck.totalSuccessfulDays;

    // Submit again for the same day
    const secondStepCount = verificationChallenge.stepGoal + 300;

    await TestHelpers.submitVerification(
      verificationChallenge,
      user2,
      secondStepCount,
      day
    );

    // Verify the successful days count didn't change
    const secondCheck = await TestHelpers.program.account.participant.fetch(
      user2.participantPDA
    );

    expect(secondCheck.totalSuccessfulDays).to.equal(initialSuccessfulDays);
    expect(secondCheck.dailyCompletions[day]).to.be.true;

    console.log("Correctly handled duplicate verification");
  });
});
