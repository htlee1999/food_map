import { Router } from 'express'
import crypto from 'node:crypto'
import db from '../../database/db.js'
import { requireUser } from '../_lib/auth.js'

const router = Router()

const MAX_GROUP_NAME_LENGTH = 100
const INVITE_CODE_BYTES = 4 // 8 hex characters

// List the signed-in user's groups with their members
router.get('/api/groups', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT g.id, g.name, g.invite_code, g.created_by,
              json_agg(
                json_build_object('id', u.id, 'display_name', u.display_name, 'avatar_url', u.avatar_url)
                ORDER BY u.display_name
              ) AS members
       FROM groups g
       JOIN group_members me ON me.group_id = g.id AND me.user_id = $1
       JOIN group_members gm ON gm.group_id = g.id
       JOIN users u ON u.id = gm.user_id
       GROUP BY g.id
       ORDER BY g.name`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ error: 'Failed to fetch groups' })
  }
})

// Create a group; the creator becomes its first member
router.post('/api/groups', requireUser, async (req, res) => {
  const name = req.body.name?.trim()
  if (!name) {
    return res.status(400).json({ error: 'Missing required field: name' })
  }
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    return res.status(400).json({ error: `Group name must be under ${MAX_GROUP_NAME_LENGTH} characters` })
  }

  try {
    const inviteCode = crypto.randomBytes(INVITE_CODE_BYTES).toString('hex')
    const result = await db.query(
      'INSERT INTO groups (name, invite_code, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, inviteCode, req.user.id]
    )
    const group = result.rows[0]
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [
      group.id,
      req.user.id,
    ])
    res.json({ message: 'Group created', group })
  } catch (error) {
    console.error('Error creating group:', error)
    res.status(500).json({ error: 'Failed to create group' })
  }
})

// Join a group via invite code
router.post('/api/groups/join', requireUser, async (req, res) => {
  const inviteCode = req.body.invite_code?.trim()
  if (!inviteCode) {
    return res.status(400).json({ error: 'Missing required field: invite_code' })
  }

  try {
    const groupResult = await db.query('SELECT * FROM groups WHERE invite_code = $1', [inviteCode])
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' })
    }

    const group = groupResult.rows[0]
    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [group.id, req.user.id]
    )
    res.json({ message: 'Joined group', group })
  } catch (error) {
    console.error('Error joining group:', error)
    res.status(500).json({ error: 'Failed to join group' })
  }
})

// Leave a group; the group is deleted when its last member leaves
router.delete('/api/groups/:id/members/me', requireUser, async (req, res) => {
  try {
    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ])
    await db.query(
      'DELETE FROM groups WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = $1)',
      [req.params.id]
    )
    res.json({ message: 'Left group' })
  } catch (error) {
    console.error('Error leaving group:', error)
    res.status(500).json({ error: 'Failed to leave group' })
  }
})

export default router
