import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, MapPin, Plane, Briefcase, Palmtree, List, Menu, X } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const Listify = () => {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("business");
  const [savedLists, setSavedLists] = useState({
    business: [],
    personal: []
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyB5uSgFLHoU9VDEViWMgfwrTmzRe3XfxKc");

  useEffect(() => {
    setMessages([
      { 
        type: "bot", 
        text: activeTab === "business" 
          ? "Welcome to Listify! I can help you plan your business trip. Ask me about meeting venues, restaurants near stations, business-friendly cafes, or any other travel needs."
          : "Welcome to Listify! I can help you plan your personal trip. Ask me about attractions, local cuisine, hidden gems, or any other travel recommendations."
      }
    ]);
  }, [activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (query.trim() === "") {
      return;
    }
    generateResponse(query);
  };

  const generateResponse = async (userQuery) => {
    setMessages(prevMessages => [...prevMessages, { type: "user", text: userQuery }]);
    setIsLoading(true);
    setQuery("");

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
      You are Listify, an AI travel assistant specialized in creating recommendation lists for ${activeTab} travelers.
      
      If it's a business trip query: Focus on professional venues, convenient transportation, business-friendly restaurants/cafes, networking opportunities, and efficient travel planning.
      
      If it's a personal trip query: Focus on tourist attractions, local experiences, food recommendations, entertainment options, and memorable activities.
      
      Always format your responses as a list with numbered items when appropriate.
      Keep your recommendations specific, practical, and actionable.
      Provide brief descriptions for each recommendation.
      If asked about a specific location, adapt your recommendations to that area.
      Aim for 5-7 recommendations unless the user specifies otherwise.
      
      If the query is unclear, politely ask for more details about their destination or needs.
      `;

      const result = await model.generateContent(`${prompt}\nUser: ${userQuery}`);
      const responseText = result.response?.text() || "Sorry, I couldn't process your request.";
      
      setMessages(prevMessages => [...prevMessages, { type: "bot", text: responseText }]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prevMessages => [...prevMessages, { type: "bot", text: "Oops! Something went wrong while generating recommendations. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentList = () => {
    // Find the last bot message
    const lastBotMessage = [...messages].reverse().find(msg => msg.type === "bot");
    if (lastBotMessage) {
      const newList = {
        id: Date.now(),
        content: lastBotMessage.text,
        timestamp: new Date().toLocaleString()
      };
      
      setSavedLists(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newList]
      }));
    }
  };

  const deleteList = (id) => {
    setSavedLists(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(list => list.id !== id)
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <List size={24} />
            <h1 className="text-2xl font-bold">Listify</h1>
          </div>
          
          <div className="hidden md:flex space-x-4">
            <button 
              className={`px-4 py-2 rounded-lg ${activeTab === "business" ? "bg-white text-indigo-600" : "text-white"}`}
              onClick={() => setActiveTab("business")}
            >
              <Briefcase size={18} className="inline mr-2" />
              Business Trip
            </button>
            <button 
              className={`px-4 py-2 rounded-lg ${activeTab === "personal" ? "bg-white text-indigo-600" : "text-white"}`}
              onClick={() => setActiveTab("personal")}
            >
              <Palmtree size={18} className="inline mr-2" />
              Personal Trip
            </button>
          </div>
          
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-700 text-white p-4">
          <button 
            className={`block w-full text-left px-4 py-2 mb-2 rounded-lg ${activeTab === "business" ? "bg-white text-indigo-600" : ""}`}
            onClick={() => {
              setActiveTab("business");
              setMobileMenuOpen(false);
            }}
          >
            <Briefcase size={18} className="inline mr-2" />
            Business Trip
          </button>
          <button 
            className={`block w-full text-left px-4 py-2 rounded-lg ${activeTab === "personal" ? "bg-white text-indigo-600" : ""}`}
            onClick={() => {
              setActiveTab("personal");
              setMobileMenuOpen(false);
            }}
          >
            <Palmtree size={18} className="inline mr-2" />
            Personal Trip
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r p-4 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4">Saved Lists</h2>
          {savedLists[activeTab].length === 0 ? (
            <p className="text-gray-500 text-sm">No saved lists yet.</p>
          ) : (
            savedLists[activeTab].map(list => (
              <div key={list.id} className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">{list.timestamp}</p>
                <p className="text-sm line-clamp-3">{list.content.split('\n')[0]}</p>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => deleteList(list.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 p-4 rounded-lg ${
                    msg.type === "user"
                      ? "bg-indigo-500 text-white ml-auto max-w-lg"
                      : "bg-white border border-gray-200 mr-auto max-w-xl shadow-sm"
                  }`}
                >
                  {msg.type === "bot" && <Bot className="inline-block mr-2 text-indigo-500" size={18} />}
                  {msg.type === "user" && <MapPin className="inline-block mr-2" size={18} />}
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 p-4 rounded-lg bg-white border border-gray-200 mr-auto max-w-xl shadow-sm">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                  </div>
                  <span className="text-gray-500">Generating recommendations...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="max-w-3xl mx-auto flex items-center">
              <input
                type="text"
                placeholder={`Ask for ${activeTab === 'business' ? 'business' : 'travel'} recommendations...`}
                className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-indigo-600 text-white p-3 rounded-r-lg hover:bg-indigo-700"
              >
                <Send size={20} />
              </button>
              {messages.length > 1 && (
                <button
                  onClick={saveCurrentList}
                  className="ml-2 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
                  title="Save List"
                >
                  <List size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listify;