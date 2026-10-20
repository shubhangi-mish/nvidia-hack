# Security, safety, and privacy

## Threat model
False citizen reports; coordinated brigading; forged official notices; malicious uploaded images/documents; prompt injection in retrieved webpages; unauthorized coordinator actions; data leakage of patients' health needs; scraping private reporter identities; SSRF via fetch tools; model hallucinations; stale-source panic; duplicate notification storms.

## Protections
- Anonymous reporting with IP/device rate limits and abuse controls; CAPTCHA only as needed, accessible alternative.
- Never auto-verify from report volume. Moderation and evidence confidence separate.
- Virus-scan uploads, restrict MIME/size, strip EXIF, private object storage, signed URLs.
- Sanitized Markdown/HTML; CSP, CSRF where relevant, secure cookies, origin checks, TLS.
- Source tool domain allowlists and SSRF protection; no local network URLs or arbitrary redirects.
- Agent prompt-injection defense: retrieved text is untrusted data; system policy and tool schema cannot be overwritten by it.
- Coordinator SSO/auth with role-based permissions; least privilege and per-organization data isolation.
- Approval gateway for external emails, public urgent alerts, assignments, third-party outreach; log who approved what and when.
- Contact verification before notifications; opt-in and unsubscribe; no broadcast to patients by default.
- Data minimization: report incident separately from personal access request; encrypted private records; redact agent logs and public responses; short retention for personal requests.
- Location privacy: publicly show facility/asset location when legitimately public; do not expose exact home or patient origin.
- Distinguish guidance from clinical advice; prominently direct emergencies to local emergency services; no treatment instructions or unauthorized medical triage.
- Incident correction, appeal, removal and dispute workflow; audit trail maintained with lawful retention.

## Safety decision matrix
Read official source = autonomous. Compute graph/route = autonomous. Draft case = autonomous. Notify subscribed user of their own case after consent = permitted within approved templates. Public emergency warning = human approval. Contact hospital/agency = human approval and authorized identity. Book/transfer patient = not in MVP. Change medical treatment = prohibited.

## Privacy compliance
Review applicable US privacy/health laws and contractual obligations before processing protected health information. Do not assume HIPAA applies or does not apply universally; avoid collecting sensitive health records in hackathon MVP. Provide privacy policy, data deletion request path, incident moderation policy, security contact.
