/**
 * Every user-facing string lives here.
 *
 * This is the enforcement point for the no-crypto-language rule: the blockchain
 * must disappear. Never write "NFT", "mint", "gas", "token", "wallet address",
 * or "contract" in the UI. Use the vocabulary below instead. A CI grep over the
 * rendered strings should never surface those words.
 */
export const copy = {
  brand: "Cracked",
  brandFull: "Cracked Passport",

  nav: {
    home: "Home",
    about: "About",
    apply: "Apply",
    passport: "Passport",
  },

  gate: {
    title: "This area is reserved for verified Cracked Fellows.",
    body: "Your Passport lives here. Sign in to open it.",
    signIn: "Sign in",
  },

  apply: {
    title: "Apply to Cracked",
    lede: "We read every application by hand. Tell us who you are and what you're building.",
    submit: "Submit application",
    success: "We've got it. We read every application by hand — we'll be in touch.",
  },

  claim: {
    accepted: "You're in.",
    acceptedBody: "You've officially been accepted as a Cracked Fellow.",
    continue: "Continue with Google",
    welcome: (n: number | string) => `Welcome, Fellow #${fmt(n)}.`,
    welcomeContinue: "Continue",
    usernameLabel: "Choose your passport handle",
    usernameHint: "This is your public passport link. You can set it once.",
    // Wallet step — the blockchain, described as ownership.
    verifyTitle: "Your Passport belongs to you.",
    verifyBody:
      "To make sure nobody can copy or take it away, we securely verify ownership. This takes a moment and stays yours forever.",
    verifyAction: "Verify ownership",
    verifyLater: "Do this later",
    creating: "Creating your Passport…",
    created: "Passport Created.",
    createdWelcome: (n: number | string) => `Welcome, Cracked Fellow #${fmt(n)}.`,
    enter: "Enter your Passport",
  },

  passport: {
    statusVerified: "Verified Fellow",
    sections: {
      about: "About",
      journey: "Journey",
      stamps: "House Stamps",
      achievements: "Achievements",
      perks: "Perks",
    },
    editProfile: "Edit profile",
    save: "Save",
    emptyStamps: "No house stamps yet. They arrive when you join a house.",
    emptyAchievements: "No achievements yet.",
    emptyPerks: "No perks yet.",
    emptyJourney: "Your journey starts the moment you claim your Passport.",
  },

  timeline: {
    accepted: "Accepted to Cracked",
    claimed: "Claimed Passport",
  },

  admin: {
    title: "Admin",
    applications: "Applications",
    fellows: "Fellows",
    catalog: "Catalog",
    approve: "Approve",
    reject: "Reject",
    issuePassport: "Issue Passport",
    issueStamp: "Issue Stamp",
    issueAchievement: "Issue Achievement",
    assignPerk: "Assign Perk",
    resendClaim: "Resend claim email",
    retryIssue: "Retry issuance",
  },

  email: {
    subject: "Welcome to Cracked.",
    heading: "You're in.",
    body: "Congratulations. You've officially been accepted as a Cracked Fellow. Your Passport is waiting.",
    button: "Open your Passport",
  },
} as const;

/** Pad a fellow number to a minimum of 3 digits (#001, #027, #1024). */
export function fmt(n: number | string): string {
  const s = String(n);
  return s.padStart(3, "0");
}
