-- Insert Admin User (password: admin123)
INSERT INTO users (roll_number, name, email, password, role) VALUES
('ADMIN001', 'Admin User', 'admin@coding.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin');

-- Insert Sample Students (password: student123)
INSERT INTO users (roll_number, name, email, password, role) VALUES
('CSE2021001', 'Rahul Kumar', 'rahul@student.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('CSE2021002', 'Priya Sharma', 'priya@student.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('CSE2021003', 'Amit Patel', 'amit@student.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- Insert Sample Assignment
INSERT INTO assignments (title, description, start_time, end_time, duration_minutes, created_by) VALUES
('Mid-Term Coding Test', 'This assessment covers Data Structures and Algorithms', 
 '2024-12-01 10:00:00', '2024-12-01 12:00:00', 120, 1);

-- Insert Sample Problems
INSERT INTO problems (assignment_id, title, description, difficulty, points, order_index) VALUES
(1, 'Two Sum', 
 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9', 
 'easy', 10, 1),

(1, 'Valid Parentheses', 
 'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.

Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false', 
 'easy', 15, 2),

(1, 'Binary Search Tree Validation', 
 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).

A valid BST is defined as follows:
- The left subtree of a node contains only nodes with keys less than the node''s key.
- The right subtree of a node contains only nodes with keys greater than the node''s key.
- Both the left and right subtrees must also be binary search trees.', 
 'medium', 25, 3);

-- Insert Test Cases for Problem 1 (Two Sum)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
(1, '[2,7,11,15]
9', '[0,1]', true),
(1, '[3,2,4]
6', '[1,2]', true),
(1, '[3,3]
6', '[0,1]', false);

-- Insert Test Cases for Problem 2 (Valid Parentheses)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
(2, '()[]{}', 'true', true),
(2, '(]', 'false', true),
(2, '([)]', 'false', false),
(2, '{[]}', 'true', false);

-- Insert Test Cases for Problem 3 (BST Validation)
INSERT INTO test_cases (problem_id, input, expected_output, is_sample) VALUES
(3, '[2,1,3]', 'true', true),
(3, '[5,1,4,null,null,3,6]', 'false', true),
(3, '[1,1]', 'false', false);