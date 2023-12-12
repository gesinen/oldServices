sudo docker stop hash-nft

sudo docker rmi hash-nft -f

sudo docker rm hash-nft

sudo docker build -t hash-nft .

sudo docker run -d --name hash-nft -p 8000:8000 hash-nft