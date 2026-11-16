"use client";

import { useRef } from "react";
import links from "./footer-links.json";
import "./footer.css";

function CopyrightArches() {
  return (
    <svg viewBox="7 9 50 43" width="17" height="15" fill="#ffbc0d" aria-hidden="true">
      <path d="M8 51C8.4 28 13.8 10 21.5 10c5 0 8.5 8.1 10.5 19.3C34 18.1 37.5 10 42.5 10 50.2 10 55.6 28 56 51h-7.1c-.2-21-3.5-35.6-6.7-35.6-3.4 0-6.7 13.1-7.3 32.1h-5.8c-.6-19-3.9-32.1-7.3-32.1-3.2 0-6.5 14.6-6.7 35.6z"/>
    </svg>
  );
}

export default function FeedbackFooter() {
  const privacy = useRef<HTMLDialogElement>(null);
  const legalRows = [links.legal.slice(0, 2), links.legal.slice(2, 4), links.legal.slice(4)];

  return (
    <footer className="guest-footer">
      <div className="guest-footer-wrap">
        <nav className="guest-footer-columns" aria-label="McDonald’s Germany">
          {links.columns.map(({ heading, links: items }) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <ul>
                {items.map(({ label, href }) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className="guest-footer-channels">
          <ul className="guest-footer-social" aria-label="McDonald’s on social media">
            {links.social.map(({ label, href }) => (
              <li key={label}>
                <a href={href} aria-label={`McDonald’s on ${label}`}>
                  <img width="32" height="32" src={`/footer/${label.toLowerCase()}.png`} alt="" loading="lazy"/>
                </a>
              </li>
            ))}
          </ul>
          <div className="guest-footer-stores">
            {links.stores.map(({ label, href }) => (
              <a key={label} href={href} aria-label={`Download the McDonald’s app on ${label}`}>
                <img src={label === "App Store" ? "/footer/app-store.svg" : "/footer/google-play.png"} alt="" width={label === "App Store" ? 120 : 134} height={40} loading="lazy"/>
              </a>
            ))}
          </div>
        </div>

        <div className="guest-footer-bottom">
          <nav className="guest-footer-legal" aria-label="Legal information">
            {legalRows.map((row) => (
              <ul key={row[0].label}>
                {row.map(({ label, href }) => (
                  <li key={label}>
                    {href ? <a href={href}>{label}</a> : (
                      <button type="button" onClick={() => privacy.current?.showModal()}>{label}</button>
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </nav>
          <p className="guest-footer-copyright"><CopyrightArches/>© 2026 McDonald’s. All rights reserved.</p>
        </div>
      </div>
      <dialog ref={privacy} className="guest-footer-privacy" aria-labelledby="footer-privacy-heading"
        onClick={event => { if (event.target === event.currentTarget) privacy.current?.close(); }}>
        <div className="guest-footer-privacy-body">
          <h2 id="footer-privacy-heading">Privacy settings</h2>
          <p>This feedback form uses no optional analytics or advertising cookies. It checks the format of your receipt number and discards it. A published review shows your rating, comment, and posting date.</p>
          <button type="button" onClick={() => privacy.current?.close()}>Done</button>
        </div>
      </dialog>
    </footer>
  );
}
