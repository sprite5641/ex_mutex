ab -p join.json -T application/json -c 100 -n 100 http://localhost:3000/event/join
ab -p join-mutex.json -T application/json -c 100 -n 100 http://localhost:3000/event/join_mutex