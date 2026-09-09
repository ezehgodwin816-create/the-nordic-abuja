# Custom domain for The Nordic Abuja site

GitHub Pages is already hosting:

`https://ezehgodwin816-create.github.io/the-nordic-abuja/`

## Option A — GitHub Pages custom domain (simple)

1. Buy a domain (Namecheap, GoDaddy, Truehost, etc.), e.g. `thenordicabuja.com`
2. In the GitHub repo → **Settings → Pages → Custom domain**
   - Enter: `thenordicabuja.com` (and optionally `www.thenordicabuja.com`)
3. At your domain registrar, add DNS records:

| Type | Host | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `ezehgodwin816-create.github.io` |

4. In GitHub Pages, enable **Enforce HTTPS** after DNS propagates (can take minutes to 48h).
5. Add a `CNAME` file in the repo root containing only:

```
thenordicabuja.com
```

## Option B — Cloudflare (recommended)

1. Add the domain to Cloudflare (free plan is fine)
2. Point registrar nameservers to Cloudflare
3. In Cloudflare DNS:
   - CNAME `www` → `ezehgodwin816-create.github.io` (Proxied)
   - Or A records to GitHub Pages IPs above
4. SSL/TLS mode: **Full**
5. Still set the custom domain in GitHub Pages settings

## After domain is live

- Update any hard-coded links if needed
- In Supabase → Authentication → URL configuration:
  - Add `https://thenordicabuja.com` and `https://www.thenordicabuja.com` to redirect URLs / site URL if you use auth on the public site later
- Paystack: add the live domain under allowed callback URLs

## Note on PMS

`pms.html` can stay on the same domain:

`https://thenordicabuja.com/pms.html`

Do not expose service-role keys on the public site.
