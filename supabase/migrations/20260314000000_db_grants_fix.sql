-- Ensure RPC functions are executable by the roles that need them
-- get_leaderboard: used by Community (authenticated users)
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO anon;
