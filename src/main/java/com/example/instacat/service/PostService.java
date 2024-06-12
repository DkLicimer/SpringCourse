package com.example.instacat.service;


import com.example.instacat.dto.PostDTO;
import com.example.instacat.entity.Image;
import com.example.instacat.entity.Post;
import com.example.instacat.entity.User;
import com.example.instacat.exceptions.PostNotFoundException;
import com.example.instacat.repository.ImageRepository;
import com.example.instacat.repository.PostRepository;
import com.example.instacat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@Service
public class PostService {
    public static final Logger LOG = LoggerFactory.getLogger(PostService.class);

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ImageRepository imageRepository;

    @Autowired

    public PostService(PostRepository postRepository, UserRepository userRepository, ImageRepository imageRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.imageRepository = imageRepository;
    }

    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreateDate();
    }

    public Post getPostById(Long postId, Principal principal) {
        User user = getUserByPrincipal(principal);
        return postRepository.findPostByIdAndUser(postId, user)
                .orElseThrow(() -> new PostNotFoundException("Post not found for username:" + user.getEmail()));
    }

    public List<Post> getAllPostsForUser(Principal principal) {
        User user = getUserByPrincipal(principal);
        return postRepository.findAllByUserOrderByCreateDateDesc(user);
    }

    public Post createPost(PostDTO postDTO, Principal principal) {
        User user = getUserByPrincipal(principal);
        Post post = new Post();
        post.setUser(user);
        post.setTitle(postDTO.getTitle());
        post.setCaption(postDTO.getCaption());
        post.setLocation(postDTO.getLocation());
        post.setLikes(0);

        LOG.info("Create new post for user: {}", user.getEmail());
        return postRepository.save(post);
    }

    public void deletePost(Long postId, Principal principal) {
        Post post = getPostById(postId, principal);
        Optional<Image> image = imageRepository.findByPostId(post.getId());
        postRepository.delete(post);
        image.ifPresent(imageRepository::delete);
    }

    public Post setLikeToPost(long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("Post not found"));

        Optional<String> userLikedPost = post.getLikedUsers()
                .stream()
                .filter(u -> u.equals(username)).findAny();

        // если пользовать есть в списке "лайкнувших"
        if (userLikedPost.isPresent()) {
            // dislike
            post.setLikes(post.getLikes() - 1);
            post.getLikedUsers().remove(username);
        } else {
            post.setLikes(post.getLikes() + 1);
            post.getLikedUsers().add(username);
        }

        return postRepository.save(post);
    }

        private User getUserByPrincipal(Principal principal) {
            String username = principal.getName();
            return userRepository.findUserByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        }
    }





