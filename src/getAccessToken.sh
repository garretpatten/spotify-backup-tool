client_id="$(op read op://Personal/5r4ylop52sbcvfpcluo67xb3w4/Client\ ID)"
client_secret="$(op read op://Personal/5r4ylop52sbcvfpcluo67xb3w4/Client\ Secret)"

endpoint="https://accounts.spotify.com/api/token"
headers="Content-Type: application/x-www-form-urlencoded"
body="grant_type=client_credentials&client_id=$client_id&client_secret=$client_secret"

curl -X POST "$endpoint" \
     -H "$headers" \
     -d "$body" |
     jq . > token.json

access_token=$(jq -r '.access_token' "token.json")

echo "$access_token"
