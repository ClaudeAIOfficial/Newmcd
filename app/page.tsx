"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import FeedbackFooter from "./FeedbackFooter";

type IconName = "arrow" | "pencil" | "receipt" | "chat" | "close" | "check" | "back" | "star";
function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const shapes: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    pencil: <><path d="m14.7 4.3 5 5M3 21l5.2-1.2L20.5 7.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4.2 15.8 3 21Z" /></>,
    receipt: <><path d="M5 3l2 1.4L9.5 3 12 4.4 14.5 3 17 4.4 19 3v18l-2-1.4-2.5 1.4-2.5-1.4L9.5 21 7 19.6 5 21Z" /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /></>,
    chat: <><path d="M21 11.5c0 4.6-4 8-9.3 8a11 11 0 0 1-3.8-.7l-4.7 1.9 1.3-4.3a7.2 7.2 0 0 1-2-4.9c0-4.5 4.3-8.1 9.3-8.1 5.1 0 9.2 3.5 9.2 8.1Z" /><path d="M7.7 11.5h.1m4 0h.1m4 0h.1" strokeWidth="2.7"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <><path d="m4.5 12 5 5 10-11" /></>,
    back: <><path d="M20 12H4m7-7-7 7 7 7" /></>,
    star: <path d="m12 2.9 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z" />,
  };
  return <svg aria-hidden="true" height={size} width={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>;
}

function Arches({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="7 9 50 43" aria-hidden="true" fill="currentColor"><path d="M8 51C8.4 28 13.8 10 21.5 10c5 0 8.5 8.1 10.5 19.3C34 18.1 37.5 10 42.5 10 50.2 10 55.6 28 56 51h-7.1c-.2-21-3.5-35.6-6.7-35.6-3.4 0-6.7 13.1-7.3 32.1h-5.8c-.6-19-3.9-32.1-7.3-32.1-3.2 0-6.5 14.6-6.7 35.6z" /></svg>;
}

function ReceiptArt() {
  return <div className="receipt-art" aria-hidden="true"><div className="paper"><Arches className="paper-arches" /><div className="paper-dash" /><div className="paper-rows"><i /><i /><i /></div><div className="order-stamp">ORDER #128</div><div className="barcode" /></div></div>;
}

type Review = { id: string; rating: number; text: string; date?: string };
type Panel = "receipt" | "review" | "help" | "thanks";
const ratingLabels = ["Poor", "Fair", "Okay", "Good", "Excellent"];
const receiptPattern = /^(?=.*[a-z0-9])[a-z0-9 #./-]{1,64}$/i;

export default function Home() {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const receiptField = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<Panel>("receipt");
  const [receipt, setReceipt] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const submissionId = useRef("");
  const [showHint, setShowHint] = useState(false);
  const [acceptingReviews, setAcceptingReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const accountDialog = useRef<HTMLDialogElement>(null);
  const [account, setAccount] = useState<{id:string;email?:string}|null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [accountConfigured, setAccountConfigured] = useState(false);
  const [accountMode, setAccountMode] = useState<"signup"|"login">("signup");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  useEffect(() => {
    fetch("/api/auth", {cache:"no-store"})
      .then(r => r.json())
      .then(data => {setAccount(data.user || null);setAccountConfigured(data.configured === true);})
      .catch(() => setAccount(null))
      .finally(() => setAccountReady(true));
  }, []);
  function openAccount(mode: "signup"|"login" = "signup") {
    setAccountMode(mode);setAccountError("");setAccountNotice("");
    if (!accountDialog.current?.open) accountDialog.current?.showModal();
  }
  function showReceipt() {
    setError(""); setShowHint(false); setPanel("receipt");
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    if (!dialog.current?.open) { dialog.current?.showModal();document.body.classList.add("has-dialog"); }
  }
  async function accountSubmit(event: FormEvent) {
    event.preventDefault();
    if (accountBusy) return;
    setAccountBusy(true);setAccountError("");setAccountNotice("");
    try {
      const res = await fetch("/api/auth", {method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:accountMode,email:accountEmail,password:accountPassword})});
      const data = await res.json() as {user?:{id:string;email?:string};error?:string;confirmationRequired?:boolean;message?:string};
      if (!res.ok) throw new Error(data.error || "Couldn't sign in.");
      if (data.confirmationRequired) {
        setAccountNotice(data.message || "Confirm your email address, then sign in.");
        setAccountMode("login");setAccountPassword("");
      } else if (data.user) {
        setAccount(data.user);setAccountPassword("");
        accountDialog.current?.close();
        showReceipt();
      } else throw new Error("Please verify your email and sign in.");
    } catch(e) {setAccountError(e instanceof Error ? e.message : "Please try again.");}
    finally {setAccountBusy(false);}
  }
  async function logout() {
    await fetch("/api/auth", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})});
    setAccount(null);setAccountPassword("");
  }


  const loadReviews = useCallback(async () => {
    setListState("loading");
    try {
      const response = await fetch("/api/reviews", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json() as { reviews?: Review[]; acceptingReviews?: boolean };
      if (!Array.isArray(data.reviews)) throw new Error();
      setAcceptingReviews(data.acceptingReviews === true);
      setReviews(data.reviews);
      setListState("ready");
    } catch { setAcceptingReviews(false); setListState("error"); }
  }, []);

  useEffect(() => { void loadReviews(); }, [loadReviews]);
  useEffect(() => {
    if (dialog.current?.open) heading.current?.focus({ preventScroll: true });
  }, [panel]);

  function openPanel(which: "help" | "receipt") {
    if (which === "receipt" && !account) {openAccount("signup");return;}
    setError(""); setShowHint(false); setPanel(which);
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    if (!dialog.current?.open) {
      dialog.current?.showModal();
      document.body.classList.add("has-dialog");
    }
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  function advance(event: FormEvent) {
    event.preventDefault();
    if (!receiptPattern.test(receipt.trim())) {
      setError("Enter the receipt or order number printed on your receipt.");
      receiptField.current?.focus();
      return;
    }
    setReceipt(receipt.trim()); setError(""); setPanel("review");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sendingRef.current) return;
    if (!rating || !text.trim()) {
      setError(!rating ? "Choose a star rating for your visit." : "Write a few words about your visit.");
      return;
    }
    sendingRef.current = true; setSending(true); setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt, rating, text: text.trim(), submissionId: submissionId.current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "Your review didn’t go through. Please try again.");
      }
      setReceipt(""); setText(""); setRating(0); submissionId.current = "";
      setPanel("thanks");
    } catch (reason) {
      setError(reason instanceof TypeError ? "Check your connection and try again. Your review is still here." : (reason as Error).message);
    } finally { sendingRef.current = false; setSending(false); }
  }

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="shell header-inner">
      <a className="brand" href="#main" aria-label="McDonald’s feedback home"><Arches className="header-arches" /><span>McDonald’s</span></a>
      <nav aria-label="Main navigation">{account ? <button className="nav-link account-nav" onClick={logout}>Sign out</button> : <button className="nav-link account-nav" onClick={() => openAccount("login")}>Sign in</button>}<a className="nav-link" href="#reviews">Guest reviews</a><button className="nav-link" onClick={() => openPanel("help")}>Receipt help</button><button className="nav-action" onClick={() => openPanel("receipt")}><Icon name="pencil" size={16} />Write a review</button></nav>
    </div></header>
    <main id="main" className="shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Guest feedback</p>
          <h1 id="hero-title">How was<br />your visit<span>?</span></h1>
          <p className="hero-intro">From the fries to the friendly faces, tell us about your last McDonald’s visit.</p>
          <button className="primary hero-button" onClick={() => openPanel("receipt")}>Write a review <Icon name="arrow" size={19} /></button>
        </div>
        <div className="meal-image"><img src="/meal.webp" alt="Golden fries in a red McDonald’s carton beside a cheeseburger" fetchPriority="high" width="1400" height="1120" /></div>
      </section>

      <div className="below">
        <section id="reviews" className="reviews" aria-labelledby="reviews-title">
          <div className="review-heading"><h2 id="reviews-title">Guest reviews</h2>{listState === "ready" && <span className="count" aria-label={reviews.length + " reviews"}>{reviews.length}</span>}</div>
          <div aria-live="polite" aria-busy={listState === "loading"}>
            {listState === "ready" && reviews.length > 0 ? <div className="review-list">{reviews.map(r => <article className="guest-review" key={r.id}><div className="review-meta"><span className="public-stars" aria-label={r.rating + " out of 5 stars"}>{[1,2,3,4,5].map(n => <Icon name="star" key={n} size={17} filled={n <= r.rating} />)}</span>{r.date && <time dateTime={r.date}>{new Intl.DateTimeFormat("en", {year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(r.date))}</time>}</div><p>{r.text}</p></article>)}</div>
            : <div className="empty"><div className="empty-icon"><Icon name="chat" size={25} /></div><div><h3>{listState === "error" ? "Reviews couldn’t load" : listState === "loading" ? "Loading reviews…" : "No reviews yet"}</h3><p>{listState === "error" ? <button className="text-button" onClick={loadReviews}>Try again <Icon name="arrow" size={15}/></button> : listState === "ready" ? (acceptingReviews ? "Be the first to share how your visit went." : "Review submissions will open soon.") : "Getting the latest guest feedback."}</p></div></div>}
          </div>
        </section>
        <aside className="receipt-card"><div className="receipt-copy"><h2>Got your receipt?</h2><p>You’ll need the number on it to leave a review.</p><button onClick={() => openPanel("help")} className="help-link">Find my receipt number <Icon name="arrow" size={15} /></button></div><ReceiptArt /></aside>
      </div>
    </main>
    <FeedbackFooter />

    <dialog ref={dialog} aria-labelledby="dialog-title" onClose={() => document.body.classList.remove("has-dialog")} onCancel={event => { if (sendingRef.current) event.preventDefault(); }} onClick={event => { if (event.target === event.currentTarget && !sendingRef.current) dialog.current?.close(); }}>
      <div className="dialog-content">
        <button className="close" aria-label="Close" disabled={sending} onClick={() => dialog.current?.close()}><Icon name="close" size={20}/></button>
        {panel === "help" ? <>
          <div className="modal-icon"><Icon name="receipt" size={26}/></div><h2 tabIndex={-1} ref={heading} id="dialog-title">Find your receipt number</h2>
          <p className="dialog-blurb">Look for “Receipt #”, “Order #” or “Order number” on your printed or digital receipt. The wording and location can vary by restaurant.</p>
          <div className="help-example"><ReceiptArt /><span>On this example receipt, you’d enter <strong>128</strong>.</span></div>
          <button className="primary full" onClick={() => openPanel("receipt")}>Write a review <Icon name="arrow" size={18}/></button>
        </> : panel === "receipt" && !acceptingReviews ? <>
          <div className="modal-icon"><Icon name="chat" size={26}/></div>
          <h2 tabIndex={-1} ref={heading} id="dialog-title">{listState === "loading" ? "Checking availability…" : "Reviews are paused"}</h2>
          <p className="dialog-blurb" role="status">{listState === "loading" ? "Checking whether the form is accepting reviews." : "Please check back later to share your visit."}</p>
          <button className="primary full" onClick={() => dialog.current?.close()}>Close</button>
        </> : panel === "thanks" ? <>
          <div className="modal-icon"><Icon name="check" size={26}/></div><h2 tabIndex={-1} ref={heading} id="dialog-title">Thanks for your review!</h2>
          <p className="dialog-blurb">We received your feedback. Our team can now read what you shared about your visit.</p>
          <button className="primary full" onClick={() => dialog.current?.close()}>Done <Icon name="check" size={18}/></button>
        </> : <>
          <div className="step-line"><Icon name={panel === "receipt" ? "receipt" : "pencil"} size={17} /><span>Step {panel === "receipt" ? "1" : "2"} of 2</span></div>
          <h2 tabIndex={-1} ref={heading} id="dialog-title">{panel === "receipt" ? "Have your receipt handy?" : "How was your visit?"}</h2>
          {panel === "receipt" ? <form onSubmit={advance}>
            <p className="dialog-blurb">Start with the number on your printed or digital receipt.</p>
            <label htmlFor="receipt-number">Receipt number</label><input id="receipt-number" ref={receiptField} value={receipt} required maxLength={64} autoComplete="off" placeholder="e.g. 128" aria-describedby="receipt-privacy" onChange={e => { setReceipt(e.target.value); setError(""); }} />
            <p id="receipt-privacy" className="field-hint">Your receipt number stays private.</p>
            <button type="button" className="text-button" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}>Where do I find it?</button>
            {showHint && <p className="hint-detail">Look for “Receipt #” or “Order #” on your receipt. If it says “Order #128”, enter 128.</p>}
            {error && <p className="error" role="alert">{error}</p>}
            <button className="primary full" type="submit">Continue <Icon name="arrow" size={18}/></button>
          </form> : <form onSubmit={submit}>
            <p className="dialog-blurb">Give your visit a rating and tell us what stood out.</p>
            <fieldset disabled={sending}><legend>Your rating</legend><div className="rating">{ratingLabels.map((label, i) => <label className={"star-choice" + (rating >= i+1 ? " selected" : "")} key={label}><input type="radio" name="rating" required value={i+1} aria-label={i+1 + (i === 0 ? " star, " : " stars, ") + label} checked={rating === i+1} onChange={() => {setRating(i+1);setError("");}} /><Icon name="star" size={32} filled={rating >= i+1} /></label>)}</div><p className="rating-label">{rating ? ratingLabels[rating-1] : "Select a rating"}</p></fieldset>
            <label htmlFor="review-text">Your review</label><textarea id="review-text" required maxLength={2000} rows={4} disabled={sending} value={text} onChange={e => {setText(e.target.value);setError("");}} placeholder="What would you like us to know?" />
            <span className="character-count">{text.length.toLocaleString()} / 2,000</span>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="form-actions"><button type="button" className="back" disabled={sending} onClick={() => {setError("");setPanel("receipt");}}><Icon name="back" size={17}/> Back</button><button className="primary" type="submit" disabled={sending}>{sending ? "Sending…" : "Submit review"}<Icon name="arrow" size={18}/></button></div>
          </form>}
        </>}
      </div>
    </dialog>
    <dialog ref={accountDialog} className="account-dialog" aria-label="Create an account or sign in">
      <form className="dialog-content" onSubmit={accountSubmit}>
        <button type="button" className="close" aria-label="Close" onClick={() => accountDialog.current?.close()}><Icon name="close" size={20}/></button>
        <div className="modal-icon"><Icon name="pencil" size={25}/></div>
        <p className="step-line">ACCOUNT REQUIRED</p>
        <h2>{accountMode === "signup" ? "Create your account" : "Welcome back"}</h2>
        <p className="dialog-blurb">{accountMode === "signup" ? "Create an account before sharing your feedback. You'll still need your receipt number." : "Sign in to continue with your receipt and review."}</p>
        {!accountConfigured && accountReady ? <p className="error" role="alert">Account registration is not available yet. The site owner must connect the authentication provider.</p> : null}
        <label htmlFor="account-email">Email address</label>
        <input id="account-email" type="email" autoComplete="email" required maxLength={254} value={accountEmail} onChange={e=>setAccountEmail(e.target.value)} placeholder="you@example.com" />
        <label htmlFor="account-password" style={{marginTop:16}}>Password</label>
        <input id="account-password" type="password" minLength={8} maxLength={128} autoComplete={accountMode === "signup" ? "new-password" : "current-password"} required value={accountPassword} onChange={e=>setAccountPassword(e.target.value)} placeholder="At least 8 characters" />
        {accountError && <p className="error" role="alert">{accountError}</p>}
        {accountNotice && <p className="account-notice" role="status">{accountNotice}</p>}
        <button className="primary full" type="submit" disabled={accountBusy || !accountConfigured || !accountReady}>{accountBusy ? "Please wait…" : accountMode === "signup" ? "Create account" : "Sign in"} <Icon name="arrow" size={17}/></button>
        <p className="account-switch">{accountMode === "signup" ? "Already have an account?" : "New here?"} <button type="button" onClick={() => {setAccountMode(accountMode === "signup" ? "login" : "signup");setAccountError("");setAccountNotice("");}}>{accountMode === "signup" ? "Sign in" : "Create an account"}</button></p>
      </form>
    </dialog>
  </>;
}
