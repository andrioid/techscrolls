-- Delete any existing phantom follows we have created. We cant handle the load
DELETE FROM "did_follow" WHERE followed_by = 'did:web:this-service-placeholder'