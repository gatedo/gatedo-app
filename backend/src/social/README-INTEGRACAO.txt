PATCH SOCIAL GATEDO — BACKEND

1) Substitua o schema.prisma por este patch e rode:
   npx prisma generate
   npx prisma migrate dev -n social_network_patch

2) Adicione SocialModule ao AppModule.

3) Se seu módulo Posts já existe, mantenha-o.
   Apenas garanta que o create de post aceite estes campos:
   - type
   - source
   - visibility
   - content
   - imageUrl
   - petId

4) Se seu GET /posts e GET /posts/pet/:petId já existem,
   garanta que retornem:
   - user { id, name, photoUrl, role }
   - pet { id, name, breed, photoUrl, ownerId }
   - commentsCount
   - savesCount
   - likes
   - visibility
   - source

5) Os novos endpoints deste patch são:
   GET  /social/feed
   GET  /social/pets/:petId
   POST /social/pets/:petId/follow
   POST /social/posts/:postId/like
   POST /social/posts/:postId/save
   POST /social/posts/:postId/comments
   POST /social/posts/:postId/share

6) No frontend deste patch, a tela usa primeiro:
   /posts
   /posts/pet/:petId
   /health/pet/:petId
   e melhora quando /social/* estiver ativo.
