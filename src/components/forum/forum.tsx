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
          return b.likes - a.likes;
        };

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
    <div className="container bg-gray-200 p-5 rounded shadow-lg">
      <div className="flex justify-between items-center mb-4  border-dark border-bottom">
        <h1 className="text-2xl font-bold ">Community Forum</h1>
        <button className="btn btn-outline-success" onClick={handleCreate}>
          Create Post
        </button>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <label htmlFor="filter" className="me-2 fw-bold">
            Filter by:
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
      {posts.length > 0 ? (
        <div className="bg-white p-4 rounded shadow-md mb-4">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th className="col-md-2">Posted by</th>
                  <th className="col-md-5">Topic</th>
                  <th className="col-md-2">Likes</th>
                  <th className="col-md-3">Last update</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    onClick={() => handleViewPost(post.id)}
                    className="cursor-pointer"
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-light rounded-circle p-2 me-2 text-primary fw-bold">
                          {post.User.charAt(0).toUpperCase()}
                        </div>
                        <span>{post.User}</span>
                      </div>
                    </td>
                    <td className="font-semibold">{post.Topic}</td>
                    <td>
                      <span>{post.Likes}</span>
                    </td>
                    <td>
                      {post.Time?.seconds ? (
                        <span className="text-gray-600 text-sm">
                          {new Date(post.Time.seconds * 1000).toLocaleString()}
                        </span>
                      ) : (
                        <span className="badge bg-secondary">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
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

      <div className="text-gray-600 text-sm mt-3">
        <small>Posts are displayed in order of most recent first</small>
      </div>
    </div>
  );
}

export default Forum;
