import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StepBuddy } from "../../target/types/step_buddy";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class TestHelpers {
  static program: Program<StepBuddy>;
  static provider: anchor.AnchorProvider;
  static wallet: anchor.Wallet;

  // Common test variables
  static readonly defaultStepGoal = 5000;
  static readonly defaultDurationDays = 7;
  static readonly defaultEntryAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
  static readonly defaultMaxParticipants = 10;

  // Store created challenges and users
  static challenges: Map<string, ChallengeFixture> = new Map();
  static users: Map<string, anchor.web3.Keypair> = new Map();

  // Initialize the test helpers
  static initialize() {
    this.provider = anchor.AnchorProvider.env();
    anchor.setProvider(this.provider);
    this.program = anchor.workspace.StepBuddy as Program<StepBuddy>;
    this.wallet = this.provider.wallet as anchor.Wallet;
  }

  // Create or get a test user
  static async getOrCreateUser(name: string): Promise<anchor.web3.Keypair> {
    if (!this.users.has(name)) {
      const user = anchor.web3.Keypair.generate();
      // Airdrop SOL to the user
      const airdropTx = await this.provider.connection.requestAirdrop(
        user.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await this.provider.connection.confirmTransaction(airdropTx);
      this.users.set(name, user);
    }
    return this.users.get(name)!;
  }

  // Get or create a challenge fixture
  static async getOrCreateChallenge(
    name: string,
    options?: Partial<ChallengeOptions>
  ): Promise<ChallengeFixture> {
    if (!this.challenges.has(name)) {
      const fixture = await this.createChallenge(options);
      this.challenges.set(name, fixture);
    }
    return this.challenges.get(name)!;
  }

  // Create a new challenge fixture
  static async createChallenge(
    options?: Partial<ChallengeOptions>
  ): Promise<ChallengeFixture> {
    const challengeId = new anchor.BN(Date.now()); // Use timestamp for uniqueness
    const stepGoal = options?.stepGoal ?? this.defaultStepGoal;
    const durationDays = options?.durationDays ?? this.defaultDurationDays;
    const entryAmount = options?.entryAmount ?? this.defaultEntryAmount;
    const maxParticipants =
      options?.maxParticipants ?? this.defaultMaxParticipants;

    // Derive PDAs
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeId.toBuffer("le", 8)],
      this.program.programId
    );

    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), challengeId.toBuffer("le", 8)],
      this.program.programId
    );

    // Initialize the challenge
    await this.program.methods
      .initializeChallenge(
        challengeId,
        stepGoal,
        durationDays,
        entryAmount,
        maxParticipants
      )
      .accountsPartial({
        authority: this.wallet.publicKey,
        challenge: challengePDA,
        vault: vaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return {
      id: challengeId,
      challengePDA,
      vaultPDA,
      stepGoal,
      durationDays,
      entryAmount,
      maxParticipants,
      participants: [],
    };
  }

  // Add a participant to a challenge
  static async addParticipant(
    challengeFixture: ChallengeFixture,
    userName: string
  ): Promise<ParticipantFixture> {
    const user = await this.getOrCreateUser(userName);

    const [participantPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        user.publicKey.toBuffer(),
        challengeFixture.id.toBuffer("le", 8),
      ],
      this.program.programId
    );

    await this.program.methods
      .joinChallenge(challengeFixture.id)
      .accountsPartial({
        challenge: challengeFixture.challengePDA,
        participant: participantPDA,
        user: user.publicKey,
        vault: challengeFixture.vaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const participant: ParticipantFixture = {
      user,
      participantPDA,
      userName,
    };

    challengeFixture.participants.push(participant);
    return participant;
  }

  // Submit a verification for a participant
  static async submitVerification(
    challengeFixture: ChallengeFixture,
    participant: ParticipantFixture,
    stepCount: number,
    day: number
  ): Promise<void> {
    await this.program.methods
      .submitVerification(challengeFixture.id, stepCount, day)
      .accountsPartial({
        challenge: challengeFixture.challengePDA,
        participant: participant.participantPDA,
        user: participant.user.publicKey,
      })
      .signers([participant.user])
      .rpc();
  }

  // Get all participant accounts in a format suitable for remaining_accounts
  static getParticipantAccounts(challengeFixture: ChallengeFixture) {
    return challengeFixture.participants.map((p) => ({
      pubkey: p.participantPDA,
      isWritable: false,
      isSigner: false,
    }));
  }

  // Process rewards for a challenge
  static async processRewards(
    challengeFixture: ChallengeFixture
  ): Promise<void> {
    const participantAccounts = this.getParticipantAccounts(challengeFixture);

    await this.program.methods
      .processRewards(challengeFixture.id)
      .accountsPartial({
        challenge: challengeFixture.challengePDA,
        authority: this.wallet.publicKey,
        challengeParticipantsList:
          participantAccounts[0]?.pubkey || this.wallet.publicKey,
      })
      .remainingAccounts(participantAccounts)
      .rpc();
  }

  // Withdraw rewards for a participant
  static async withdrawReward(
    challengeFixture: ChallengeFixture,
    participant: ParticipantFixture
  ): Promise<void> {
    const participantAccounts = this.getParticipantAccounts(challengeFixture);

    await this.program.methods
      .withdrawReward(challengeFixture.id)
      .accountsPartial({
        challenge: challengeFixture.challengePDA,
        participant: participant.participantPDA,
        user: participant.user.publicKey,
        vault: challengeFixture.vaultPDA,
        challengeParticipantsList:
          participantAccounts[0]?.pubkey || this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(participantAccounts)
      .signers([participant.user])
      .rpc();
  }
}

// Types
export interface ChallengeOptions {
  stepGoal: number;
  durationDays: number;
  entryAmount: anchor.BN;
  maxParticipants: number;
}

export interface ChallengeFixture {
  id: anchor.BN;
  challengePDA: PublicKey;
  vaultPDA: PublicKey;
  stepGoal: number;
  durationDays: number;
  entryAmount: anchor.BN;
  maxParticipants: number;
  participants: ParticipantFixture[];
}

export interface ParticipantFixture {
  user: anchor.web3.Keypair;
  participantPDA: PublicKey;
  userName: string;
}
