# SnapShare Scaling Plan

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
                                                                                  |-- reads the original and saves the thumbnail --> Object storage
                                                                                  |-- saves the thumbnail link --> Database primary
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
3. The app server checks the login token and the file type and size.
4. The app server saves the 2 MB original in object storage and receives a file key.
5. The app server writes a photo record to the primary database. The record holds the owner and the time and the file key and a pending thumbnail status.
6. The app server adds a thumbnail job with the photo id to the queue.
7. The app server answers the user with success. The upload feels instant.
8. A worker takes the job from the queue and reads the original from object storage.
9. The worker creates the 50 KB thumbnail and saves it in object storage.
10. The worker updates the photo record with the thumbnail link and a ready status.
11. The feed entries of the followers refresh. Their next feed view loads the thumbnail through the CDN.
12. If a worker fails midway the queue offers the job to another worker so the thumbnail still appears.

## Trade-offs

- **Fresh data against speed:** The cache returns feeds fast but can show data that is a few seconds old. A follower may see a new photo with a short delay. A short expiry time keeps the delay small.
- **Replica lag:** The read replica copies the primary with a tiny delay. A user who uploads and refreshes at once could miss the newest photo. Reading the own profile from the primary fixes that case.
- **Instant upload against instant thumbnail:** The queue makes uploads fast but the thumbnail arrives a moment later. The app shows a placeholder until the worker finishes.
- **Cost against performance:** The CDN and object storage and extra servers add monthly cost and more parts to run. Rules that move old photos to cheaper storage tiers keep the yearly 748 TB growth affordable.