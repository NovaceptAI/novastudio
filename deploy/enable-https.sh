#!/usr/bin/env bash
# One-off: issue the certificate for novastudio.novaceptai.com and switch nginx
# from the HTTP bootstrap to the HTTPS config. Run once DNS resolves here.
set -euo pipefail

HOST=novastudio.novaceptai.com
HERE="$(cd "$(dirname "$0")" && pwd)"

EXPECTED="$(curl -s --max-time 5 https://checkip.amazonaws.com)"
# Ask a public resolver, not this server's: Let's Encrypt validates from the
# internet, and the local (VPC) resolver can hold a stale NXDOMAIN for minutes
# after the record is added.
ACTUAL="$(dig +short A "$HOST" @1.1.1.1 | tail -1 || true)"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "$HOST resolves to '${ACTUAL:-nothing}', expected $EXPECTED. Fix DNS first." >&2
  exit 1
fi

# Same issuance settings as academy.novaceptai.com: webroot, ECDSA, reload hook.
sudo certbot certonly --webroot -w /var/www/letsencrypt -d "$HOST" \
  --key-type ecdsa --non-interactive --agree-tos --keep-until-expiring \
  --deploy-hook '/usr/sbin/nginx -t && /usr/bin/systemctl reload nginx'

sudo install -m 644 "$HERE/nginx/$HOST.conf" "/etc/nginx/sites-available/$HOST"
sudo nginx -t
sudo systemctl reload nginx
echo "HTTPS live: https://$HOST"
