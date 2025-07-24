import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, collection, getDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

type ForumPost = {
  id: string;
  index: number;
  User: string;
  Topic: string;
  Likes: number;
  LikedBy: string[];
  Message: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

function Forum() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [filter, setFilter] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch all forum posts and apply filter/search
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data() as UserDetails);
          } else {
            console.log("User document does not exist.");
          }
        } catch (err: any) {
          console.error("Error fetching user data:", err.message);
        }
      } else {
        setUserDetails(null);
      }

      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Sorting functions for recent and likes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Forum"));
        const forumData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            User: data.User || "",
            Topic: data.Topic || "",
            Likes: data.Likes || 0,
            Message: data.Message || "",
            Time: data.Time,
          } as ForumPost;
        });

        const recent = (a, b) => {
          if (!a.Time?.seconds && !b.Time?.seconds) return 0;
          if (!a.Time?.seconds) return 1;
          if (!b.Time?.seconds) return -1;

          return b.Time.seconds - a.Time.seconds;
        };

        const like = (a, b) => {
          if (!a.Likes && !b.Likes) return 0;
          if (!a.Likes) return 1;
          if (!b.Likes) return -1;

          return b.Likes - a.Likes;
        };

        // Sort and filter posts based on user selection
        const sortedPosts = forumData.sort(filter == "recent" ? recent : like);
        const filteredList = sortedPosts.filter((post) =>
          post.Topic.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setPosts(filteredList);
      } catch (err) {
        console.error("Error fetching forum data:", err);
      }
    };

    fetchData();
  }, [filter, searchTerm]);

  if (!authChecked) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="container text-center p-5">
        <p className="text-danger">User not logged in or user data missing.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleCreate = async () => {
    try {
      const user = auth.currentUser;
      console.log(user);
      navigate("/createPost");
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  const handleViewPost = (postId: string) => {
    navigate(`/viewPost/${postId}`);
  };

  return (
    <div className="container bg-white 200 p-5 rounded-2xl shadow-lg">
      {/* Header and create post button */}
      <div className="flex justify-between items-center mb-4  border-dark border-bottom">
        <h1 className="text-center text-2xl font-bold ">Community Forum💬</h1>
        <button className="btn btn-outline-success" onClick={handleCreate}>
          Create Post
        </button>
      </div>
      {/* Filter and search controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <label htmlFor="filter" className="me-2 fw-bold">
            Order by:
          </label>
          <select
            id="filter"
            className="form-select d-inline-block w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
        <input
          className="form-control w-50"
          type="text"
          placeholder="Search by topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* Posts table or empty state */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleViewPost(post.id)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all"
            >
              <div className="flex items-center mb-2">
                <div className="bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold me-3">
                  {post.User.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">{post.User}</div>
              </div>
              <h3 className="text-lg font-semibold mb-1 truncate ">
                {post.Topic}
              </h3>
              <p className="text-gray-700 text-sm line-clamp-3">
                {post.Message}
              </p>
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>{post.Likes} likes</span>
                <span>
                  {post.Time?.seconds
                    ? new Date(post.Time.seconds * 1000).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Show empty state if no posts
        <div className="bg-white p-5 rounded shadow-md text-center">
          <div className="mb-3">
            <i
              className="bi bi-chat-square-text"
              style={{ fontSize: "3rem" }}
            ></i>
          </div>
          <h4>No posts available</h4>
          <p className="text-gray-500">Be the first to create a discussion!</p>
          <button className="btn btn-success mt-3" onClick={handleCreate}>
            Create First Post
          </button>
        </div>
      )}
    </div>
  );
}

export default Forum;
