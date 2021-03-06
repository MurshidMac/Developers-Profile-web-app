const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { validationResult } = require("express-validator");


// @route   POST api/posts
// @desc    Create a post
// @access  Private
exports.addPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select("-password");

    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
exports.getAllPosts = async(req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}


// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
exports.getPostById = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if(!post) {
      return res.status(404).json({ msg: 'Post not found'});
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if(err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found'});
    }
    res.status(500).send('Server Error');
  }
}

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
exports.deletePost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // If post doesn't exist.
    if(!post) {
      return res.status(404).json({ msg: 'Post not found'});
    }

    // Check user
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({ msg: 'User not authorized' })
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    // If ID is not a tipe of objectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' })
    }
    res.status(500).send('Server Error');
  }
}

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
exports.likePost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if(post.likes.filter(like => like.user.toString() === req.user.id).length  > 0 ) {
      return res.status(400).json({ msg: 'Post already liked'});
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}


// @route   PUT api/posts/unlike/:id
// @desc    unLike a post
// @access  Private
exports.unLikePost = async(req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if(post.likes.filter(like => like.user.toString() === req.user.id).length  === 0 ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }
    
    // Get remove index
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

// @route   POST api/posts/comment/:id
// @desc    comment on a post
// @access  Private
exports.commentOnPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id).select("-password");
    const post = await Post.findById(req.params.id);


    const newcomment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    };

    post.comments.unshift(newcomment);

    await post.save();

    res.json(post.comments);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}



// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
exports.deleteComment = async(req, res) => {
  try {
    const post =await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(comment=> comment.id = req.params.comment_id);

    // Make sure comment exists
    if(!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if(comment.user.toString() !== req.user.id) {
      return res.status(401).json({ mgs: 'user not authorized' })
    }

     // Get remove index
     const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

     post.comments.splice(removeIndex, 1);
 
     await post.save();
 
     res.json(post.comments);
  } catch (err) {
    console.error(err.message);
      res.status(500).send("Server Error");
  }
}