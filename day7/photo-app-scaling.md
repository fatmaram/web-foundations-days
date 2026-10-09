SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from people they follow. The plan below sizes the system and shows how each part grows with traffic.

## Assumptions

- 10 million registered users
- 10% of users are active each day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- An average photo takes 2 MB
- Each photo also gets a 50 KB thumbnail
- One day has 86,400 seconds
- Peak traffic runs at 5 times the average
- Storage uses decimal units where 1 TB equals 1,000,000 MB
- The estimates count photo files only because user records and follow lists stay tiny beside them

## Daily active users

10,000,000 registered users x 10% = 1,000,000 daily active users

## Estimates

### Uploads per second

- Uploads per day: 1,000,000 users x 1 photo = 1,000,000 photos
- Average: 1,000,000 / 86,400 = about 11.6 uploads per second
- Peak: 11.6 x 5 = about 58 uploads per second

### Feed views per second

- Feed views per day: 1,000,000 users x 50 pages = 50,000,000 views
- Average: 50,000,000 / 86,400 = about 579 views per second
- Peak: 579 x 5 = about 2,900 views per second

### Photo storage per year

- Originals per day: 1,000,000 x 2 MB = 2,000,000 MB = 2 TB
- Thumbnails per day: 1,000,000 x 50 KB = 50 GB
- Total per day: about 2.05 TB
- Total per year: 2.05 TB x 365 = about 748 TB (close to 0.75 PB)
- Split per year: about 730 TB of originals and 18 TB of thumbnails

### Summary

| Measure | Average | Peak |
| --- | --- | --- |
| Uploads per second | 11.6 | 58 |
| Feed views per second | 579 | 2,900 |
| Storage per year | 748 TB | n/a |

## Read-heavy or write-heavy

SnapShare is read-heavy. The system serves about 579 feed views for every 11.6 uploads. That ratio is 50 to 1. Each feed page also loads several thumbnails so the real read load on photo files is higher still.

What that means for the design:
- Reads need the most attention so the plan caches aggressively.
- A CDN serves photo files and keeps that traffic away from the servers.
- A read replica answers feed queries so the primary database can focus on writes.
- Writes stay simple because 58 uploads per second at peak is a modest load for one primary database.

## Photos stay out of the database

Photo files belong in object storage. A database stores structured rows and does that job well. A 2 MB file inside a row causes several problems:
- 748 TB of new files per year would swell the database and slow its backups and copies to the replica.
- Database storage costs far more per GB than object storage.
- Every photo download would occupy a database connection that real queries need.
- Object storage grows without limit and keeps each file in several places for durability. It also connects directly to a CDN.

The database keeps one small row for each photo with the owner and the time and the file key. Object storage holds the files. The app serves them through the CDN.

## Architecture diagram
```
Users (phone or web)
 |
 |-- photo requests --> CDN --(cache miss)--> Object storage
 |                                            (originals and thumbnails)
 |
 |-- API requests --> Load balancer --> App servers (3 or more copies)
                                          |
                                          |-- feed reads --> Cache --(on a miss)--> Read replica
                                          |
                                          |-- writes --> Database primary --copies data--> Read replica
                                          |
                                          |-- saves the original photo --> Object storage
                                          |
                                          |-- adds a thumbnail job --> Queue --> Worker
                                                                                   |
                                                                                   |-- reads original & saves thumbnail --> Object storage
                                                                                   |-- updates thumbnail link --> Database primary
```

## Components

- **CDN:** The CDN solves slow photo loading for faraway users by serving cached copies from locations close to them.
- **Load balancer:** The load balancer solves server overload by spreading requests across the app servers and skipping any server that fails.
- **App servers:** The app servers solve growing traffic because several identical copies share the work and more copies can join at any time.
- **Cache:** The cache solves repeated database reads by keeping hot feeds and photo details in fast memory.
- **Database primary:** The primary database solves reliable storage of users and follows and photo records by accepting every write in one place.
- **Read replica:** The read replica solves read pressure on the primary by answering feed queries from a live copy of the data.
- **Object storage:** Object storage solves the cost and size of 748 TB of photos per year by holding files cheaply in several places.
- **Queue:** The queue solves slow uploads by holding thumbnail jobs so the user gets an answer without waiting for image processing.
- **Worker:** The worker solves heavy image processing by creating thumbnails in the background and away from the app servers.

## Upload flow

1. The user picks a photo and taps Upload in the app.
2. The request reaches the load balancer and goes to one app server.
3. The app server checks the login token and validates the file type and size.
4. The app server saves the 2 MB original in object storage and receives a file key.
5. The app server writes a photo record to the primary database holding owner details, upload time, the file key, and a pending status for the thumbnail.
6. The app server adds a thumbnail job containing the photo ID and original file key to the message queue.
7. The app server immediately sends a success response to the client user so the upload feels instantaneous.
8. A background worker pulls the job from the queue and downloads the original photo from object storage.
9. The worker resizes the photo to generate the 50 KB thumbnail and saves this thumbnail file back to object storage.
10. The worker updates the photo record in the primary database with the thumbnail URL and sets the thumbnail status to ready.
11. The newly created thumbnail is served to followers when their feeds refresh, fetching through the CDN.
12. If a worker fails midway through processing, the queue visibility timeout expires and re-delivers the message to another worker to ensure retry durability.

## Trade-offs

- **Replication Lag vs. Immediate Consistency:** Using a read replica to offload query volume introduces asynchronous replication lag. A user who uploads a photo and immediately refreshes their feed might query a read replica that has not yet ingested the primary's latest writes, making their post temporarily invisible. *Mitigation:* Query the primary database directly for a user's own profile or recent actions, while serving public feeds from read replicas.
- **Asynchronous Processing vs. Instant Thumbnail Availability:** Offloading thumbnail generation to a background worker keeps API response times low, but introduces latency before the thumbnail appears in feeds. Users viewing a feed within milliseconds of an upload might see a loading placeholder. *Mitigation:* Display a client-side placeholder or blurred preview until the worker marks the thumbnail status as ready in the database.
- **Eventual Consistency in Cache vs. Database Load:** Serving user feeds out of an in-memory cache drastically improves throughput but risks serving stale feed lists if cache invalidation misses an edge case. *Mitigation:* Set short Time-To-Live (TTL) durations on cached feeds so stale states resolve automatically within seconds.