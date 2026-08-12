// Users whose content (places/ratings) is visible to a user: themselves
// plus everyone sharing at least one group with them. Expects the user id
// as $1 in the enclosing query.
export const VISIBLE_USERS_SQL = `
  SELECT friend.user_id
  FROM group_members mine
  JOIN group_members friend ON friend.group_id = mine.group_id
  WHERE mine.user_id = $1
`

// Shared cap for user-written text (rating reviews and admin comments)
export const MAX_REVIEW_LENGTH = 1000
