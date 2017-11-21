
npm install -g elasticdump

##copy dashboards,visualizations,searches from one ES to another ES
elasticdump --input=http://10.4.6.11:9200/.kibi --output=$ --type=data --searchBody='{"filter": { "or": [ {"type": {"value": "dashboard"}}, {"type" : {"value":"visualization"}}, {"type": {"value": "search"}}] }}' > kibana-exported-steve.json

elasticdump --input=kibana-exported-steve.json --output=http://elasticsearch:9200/.kibana_steve --type=data

git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch config/kibana.yml' --prune-empty --tag-name-filter cat -- --all