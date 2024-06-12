package com.example.instacat.facade;

import com.example.instacat.dto.PostDTO;
import com.example.instacat.entity.Post;
import org.springframework.stereotype.Component;

@Component
public class PostFacade {
    public PostDTO postToPostDTO(Post post) {
        PostDTO postDTO = new PostDTO();
        postDTO.setId(post.getId());
        postDTO.setUsername(post.getUser().getUsername());
        postDTO.setCaption(post.getCaption());
        postDTO.setTitle(post.getTitle());
        postDTO.setLikes(post.getLikes());
        postDTO.setLikedUsers(post.getLikedUsers());
        postDTO.setLocation(post.getLocation());

        return postDTO;
    }
}
